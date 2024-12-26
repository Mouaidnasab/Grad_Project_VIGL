# routers/screen_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, desc
from pydantic import BaseModel
from db.database import engine
from db.models import Products, Categories, Screens, ProductScreen, PriceHistory, Promotions
from dependencies.auth import get_current_active_user, User, require_Role  
import json
import os
from fastapi.responses import JSONResponse
import requests
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime
from typing import List



router = APIRouter(
    prefix="/screen",
    tags=["Screen Management"],
)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session

src_directory = "./src"

class Element(BaseModel):
    type: str
    x: float
    y: float
    width: float
    height: float
    text: str
    color: str
    fill_color: str
    rotation: int
    horizontal_alignment: str
    vertical_alignment: str
    font_size: int



class ScreenTemplate(BaseModel):
    template_name: str
    elements: list[Element]


class UpdateRequest(BaseModel):
    screen_id: int
    template_name: str

class UpdateResponse(BaseModel):
    message: str
    screen: Screens


allowed_colors = {
    "black": (0, 0, 0),
    "white": (255, 255, 255),
    "red": (255, 0, 0),
    "transparent": (0, 0, 0, 0)
}

def validate_color(color):
    return color if color in allowed_colors else "black"


def upload_to_esp32(screen_ip, template_data,session,current_screen_id):
    try:
        esp_url = f"http://{screen_ip}/upload"
        font_path = os.path.join(src_directory, 'Futura Heavy font.ttf')
        width_before = 296
        height_before = 128
        elements = template_data.get('elements', [])

        img = Image.new('RGB', (width_before, height_before), color='white')
        draw = ImageDraw.Draw(img)

        try:
            default_font = ImageFont.truetype(font_path, 16)
        except IOError:
            default_font = ImageFont.load_default()

        

        for element in elements:
            x = int(element.get('x', 0))
            y = int(element.get('y', 0))
            w = int(element.get('width', 100))
            h = int(element.get('height', 50))

            fill_color = validate_color(element.get('fill_color', 'transparent'))

            if element['type'] == 'text':
                text = element.get('text', '')
                font_size = element.get('font_size', 16)
                rotation = element.get('rotation', 0)
                horizontal_alignment = element.get('horizontal_alignment', 'center')
                vertical_alignment = element.get('vertical_alignment', 'center')
                color = validate_color(element.get('color', 'black'))

                if text and text.startswith('dynamic:'):
                    text = text.replace('dynamic:', '')
                    ProductID = session.exec(select(ProductScreen.ProductID).where(ProductScreen.ScreenID == current_screen_id)).first()

                    match text:
                        case 'ProductName':
                            product = session.exec(
                                select(Products.ProductName).where(Products.ProductID == ProductID)
                            ).first()
                            text = product if product else "Product not found"
                        
                        case 'CategoryName':
                            category = session.exec(
                                select(Categories.CategoryName).where(Categories.CategoryID == ProductID)
                            ).first()
                            text = category if category else "Category not found"

                        case 'Price':
                            price = session.exec(
                                select(PriceHistory.Price)
                                .where(PriceHistory.ProductID == ProductID, PriceHistory.EndDate == None)
                            ).first()
                            text = f"{price}TL"

                        case 'Discount':
                            promotion = session.exec(
                                select(Promotions.Discount).where(Promotions.ProductID == ProductID)
                            ).first()
                            text = f"{promotion} %" if promotion else "No discount available"

                        case 'FinalPrice':
                            price = session.exec(
                                select(PriceHistory.Price)
                                .where(PriceHistory.ProductID == ProductID, PriceHistory.EndDate == None)
                            ).first()
                            discount = session.exec(
                                select(Promotions.Discount).where(Promotions.ProductID == ProductID)
                            ).first()
                            if price:
                                final_price = price - (price * (discount / 100)) if discount else price
                                text = f"{final_price}TL"
                            else:
                                text = "Price not available"

                        case _:
                            text = "Invalid request"

                try:
                    font = ImageFont.truetype(font_path, font_size)
                except IOError:
                    font = default_font

                text_w, text_h = font.getbbox(text)[2:]
                print(horizontal_alignment, vertical_alignment)

                if horizontal_alignment == 'center':
                    text_x = x + (w - text_w) / 2
                elif horizontal_alignment == 'flex-end':
                    text_x = x + w - text_w
                else:
                    text_x = x
                if vertical_alignment == 'center':
                    text_y = y + (h - text_h) / 2
                elif vertical_alignment == 'flex-end':
                    text_y = y + h - text_h
                else:
                    text_y = y
                print(text_x, text_y)

                

                if rotation != 0:
                    text_img = Image.new('RGBA', (w, h), (255, 255, 255, 0))
                    text_draw = ImageDraw.Draw(text_img)
                    if fill_color == 'transparent':
                        text_draw.rectangle([0, 0, w, h], width=0)
                    else:
                        text_draw.rectangle([0, 0, w, h], fill=fill_color)
                    text_draw.fontmode = '1'
                    text_draw.text((text_x - x, text_y - y), text, font=font, fill=color)
                    rotated_text = text_img.rotate(-rotation, expand=True)
                    img.paste(rotated_text, (x, y), rotated_text)
                else:
                    if fill_color == 'transparent':
                        draw.rectangle([x, y, x + w, y + h], width=0)
                    else:
                        draw.rectangle([x, y, x + w, y + h], fill=fill_color)
                    draw.fontmode = '1'
                    draw.text((text_x, text_y - font_size*0.12), text, font=font, fill=color)

        img = img.rotate(-90, expand=True)

        # img.show()

        width, height = img.size
        black_img = Image.new("1", (width, height))  # Black (1-bit) image
        red_img = Image.new("1", (width, height))    # Red (1-bit) image

        pixels = img.load() # Load pixel data
        print(f"Image size: {width}x{height}")
        # Loop through all pixels and separate black and red data
        for y in range(height):
            for x in range(width):
                # print(f"Processing pixel: {x}, {y}")
                black_img.putpixel((x, y), 1)
                red_img.putpixel((x, y), 1)
                r, g, b = pixels[x, y]
                if r > 150 and g < 100 and b < 100:  # Red pixel threshold
                    red_img.putpixel((x, y), 0)  # Red
                else:
                    if r < 100 and g < 100 and b < 100: # Black pixel threshold
                        black_img.putpixel((x, y), 0) # Black



        #upload red image
        files = {"red_file": red_img.tobytes()}
        response = requests.post(esp_url, files=files)
        print(f"Response: {response.status_code} - {response.text}")
    
        #upload black image
        files = {"black_file": black_img.tobytes()}
        response = requests.post(esp_url, files=files)
        print(f"Response: {response.status_code} - {response.text}")

    except Exception as e:
        print("Error:", str(e))



    

@router.post("/add_template", response_model=ScreenTemplate)
def add_screen_template(
    screen_template: ScreenTemplate,
    # current_user: User = Depends(get_current_active_user)
):
    template_name = screen_template.template_name
    json_path = os.path.join(src_directory, 'screen_templates.json')

    if os.path.exists(json_path):
        with open(json_path, 'r') as json_file:
            existing_data = json.load(json_file)
    else:
        existing_data = {}

    if template_name in existing_data:
        raise HTTPException(
            status_code=400,
            detail=f"Template name '{template_name}' already exists. Choose a different name."
        )

    data_without_template_name = screen_template.model_dump(exclude={'template_name'})

    existing_data[template_name] = data_without_template_name

    with open(json_path, 'w') as json_file:
        json.dump(existing_data, json_file, indent=4)

    return screen_template
@router.post("/update_display", response_model=UpdateResponse)
def update_screen_display(
    update_request: UpdateRequest,
    session: Session = Depends(get_session),
    # current_user: User = Depends(get_current_active_user)  
):
    
    current_screen_id = update_request.screen_id
    template_name = update_request.template_name

    json_path = os.path.join(src_directory, 'screen_templates.json')

    if os.path.exists(json_path):
        with open(json_path, 'r') as json_file:
            screen_templates = json.load(json_file)
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen templates file not found.",
        )
    if template_name == "":
        result = session.exec(
            select(Promotions)
            .where(
                (ProductScreen.ScreenID == current_screen_id) & 
                (ProductScreen.ProductID == Promotions.ProductID)
            )
            .order_by(desc(Promotions.PromotionID))
        ).first()



        if result and result.EndDate > datetime.now() and result.Discount > 0:
            template_name = "Promotion"
        else:
            template_name = "Standard"

    if template_name != "" and template_name not in screen_templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screen template '{template_name}' not found.",
        )

    screen = session.exec(select(Screens).where(Screens.ScreenID == current_screen_id)).first()
    if not screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen not found.",
        )

    screen_ip = screen.IP
    template_data = screen_templates[template_name]

    upload_to_esp32(screen_ip, template_data,session,current_screen_id)

    return UpdateResponse(
        message="Screen updated successfully.",
        screen=screen
    )




@router.post("/add", response_model=Screens)
def add_screen(
    screen_add: Screens,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"]))  
):
    new_screen = Screens(**screen_add.model_dump())
    session.add(new_screen)
    session.commit()
    session.refresh(new_screen)
    return new_screen


@router.get("/get", response_model=List[Screens])
def get_screens(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"]))
):
    # Query for screens that are not linked in ProductScreen
    linked_screen_ids = session.exec(select(ProductScreen.ScreenID)).all()
    screens = session.exec(select(Screens).where(Screens.ScreenID.not_in(linked_screen_ids))).all()
    return screens