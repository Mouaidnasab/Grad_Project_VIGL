# routers/screen_management.py

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select, desc
from pydantic import BaseModel
from db.database import engine
from db.gov_database import gov_engine
from db.models import Screens, ProductScreen, PriceHistory, Promotions
from db.gov_models import Categories, GovProducts
from dependencies.auth import User, get_current_active_user, require_Role
import json
import os
from fastapi.responses import StreamingResponse
import requests
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime
from typing import List, Optional


from io import BytesIO
from barcode import Code128
from barcode.writer import ImageWriter
import qrcode


router = APIRouter(
    prefix="/screen",
    tags=["Screen Management"],
)


def get_session():
    with Session(engine) as session:
        yield session


def get_gov_session():
    with Session(gov_engine) as session:
        yield session


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
    font_size: Optional[int] = 16


class ScreenTemplate(BaseModel):
    template_name: str
    elements: list[Element]


class ScreenUpdateRequest(BaseModel):
    product_id: int
    template_name: str


class UpdateResponse(BaseModel):
    message: str


allowed_colors = {
    "black": (0, 0, 0),
    "white": (255, 255, 255),
    "red": (255, 0, 0),
    "transparent": (0, 0, 0, 0),
}

src_directory = "./src"

font_path = os.path.join(src_directory, "Futura Heavy font.ttf")


def _validate_color(c: str) -> str:
    return c if c in allowed_colors else "black"


def generate_image(
    template_data: dict,
    session: Session = Depends(get_session),
    gov_session: Session = Depends(get_gov_session),
    current_screen_id: int | None = None,
    *,
    dummy: bool = False,
) -> Image.Image:
    width_before, height_before = 360, 240
    img = Image.new("RGB", (width_before, height_before), "white")
    draw = ImageDraw.Draw(img)

    try:
        default_font = ImageFont.truetype(font_path, 16)
    except IOError:
        default_font = ImageFont.load_default()

    elements = template_data.get("elements", [])
    for element in elements:
        x = int(element.get("x", 0))
        y = int(element.get("y", 0))
        w = int(element.get("width", 100))
        h = int(element.get("height", 50))

        fill_color = element.get("fill_color", "transparent")
        fill_color = _validate_color(fill_color)

        etype = element["type"]

        token = element.get("text", "")
        if token.startswith("dynamic:"):
            field = token[8:]
            if dummy or session is None:
                samples = {
                    "ProductID": "123456",
                    "ProductName": "Sample Product",
                    "CategoryName": "Beverages",
                    "Price": "19.95TL",
                    "Discount": "15 %",
                    "FinalPrice": "16.96TL",
                }
                token = samples.get(field, f"({field})")
            else:
                ProductID = session.exec(
                    select(ProductScreen.ProductID).where(
                        ProductScreen.ScreenID == current_screen_id
                    )
                ).first()
                match field:
                    case "ProductID":
                        token = str(ProductID) if ProductID else "ProductID?"
                    case "ProductName":
                        token = (
                            gov_session.exec(
                                select(GovProducts.ProductName).where(
                                    GovProducts.ProductID == ProductID
                                )
                            ).first()
                            or "Name?"
                        )
                    case "CategoryName":
                        token = (
                            gov_session.exec(
                                select(Categories.CategoryName)
                                .join(
                                    GovProducts,
                                    GovProducts.CategoryID == Categories.CategoryID,  # type: ignore
                                )
                                .where(GovProducts.ProductID == ProductID)
                            ).first()
                            or "Category?"
                        )
                    case "Price":
                        price = session.exec(
                            select(PriceHistory.Price).where(
                                PriceHistory.ProductID == ProductID,
                                PriceHistory.EndDate == None,  # noqa: E711
                            )
                        ).first()
                        token = f"{price}TL" if price else "Price?"
                    case "Discount":
                        disc = session.exec(
                            select(Promotions.Discount).where(
                                Promotions.ProductID == ProductID
                            )
                        ).first()
                        token = f"{disc} %" if disc else "0 %"
                    case "FinalPrice":
                        price = session.exec(
                            select(PriceHistory.Price).where(
                                PriceHistory.ProductID == ProductID,
                                PriceHistory.EndDate == None,  # noqa: E711
                            )
                        ).first()
                        disc = (
                            session.exec(
                                select(Promotions.Discount)
                                .where(Promotions.ProductID == ProductID)
                                .order_by(desc(Promotions.EndDate))
                            ).first()
                            or 0
                        )
                        token = f"{price - price * disc / 100:.1f}TL" if price else "--"
                    case _:
                        token = "(invalid)"

        if etype == "text":
            font_size = element.get("font_size", 16)
            rotation = int(element.get("rotation", 0))
            h_align = element.get("horizontal_alignment", "center")
            v_align = element.get("vertical_alignment", "center")
            color = _validate_color(element.get("color", "black"))

            try:
                font = ImageFont.truetype(font_path, font_size)
            except IOError:
                font = default_font

            text_w, text_h = font.getbbox(token)[2:]
            if h_align == "center":
                tx = x + (w - text_w) / 2
            elif h_align == "flex-end":
                tx = x + w - text_w
            else:
                tx = x
            if v_align == "center":
                ty = y + (h - text_h) / 2
            elif v_align == "flex-end":
                ty = y + h - text_h
            else:
                ty = y

            if fill_color != "transparent":
                draw.rectangle([x, y, x + w, y + h], fill=fill_color)

            if rotation:
                temp = Image.new("RGBA", (w, h), (0, 0, 0, 0))
                ImageDraw.Draw(temp).text(
                    (tx - x, ty - y), token, font=font, fill=color
                )
                img.paste(
                    temp.rotate(-rotation, expand=True),
                    (x, y),
                    temp.rotate(-rotation, expand=True),
                )
            else:
                draw.text((tx, ty - font_size * 0.12), token, font=font, fill=color)

        elif etype == "barcode":
            writer_opts = {"write_text": False, "quiet_zone": 0}
            barcode_img = Code128(token, writer=ImageWriter()).render(
                writer_options=writer_opts
            )

            barcode_img = barcode_img.convert("RGBA")
            newdata = [
                (255, 255, 255, 0)
                if (r > 250 and g > 250 and b > 250)
                else (r, g, b, 255)
                for (r, g, b, *_) in barcode_img.getdata()
            ]
            barcode_img.putdata(newdata)

            barcode_img = barcode_img.resize((w, h), Image.LANCZOS)  # type: ignore
            img.paste(barcode_img, (x, y), barcode_img)

        elif etype == "qrcode":
            qrobj = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,  # type: ignore
                box_size=10,
                border=0,
            )
            qrobj.add_data(token)
            qrobj.make(fit=True)
            qr_img = qrobj.make_image(
                fill_color="black", back_color=(255, 255, 255, 0)
            ).convert("RGBA")  # type: ignore

            qr_img = qr_img.resize((w, h), Image.LANCZOS)  # type: ignore
            img.paste(qr_img, (x, y), qr_img)

    return img.rotate(-270, expand=True)


def upload_to_esp32(
    screen_ip: str, template_data: dict, session, gov_session, current_screen_id: int
):
    try:
        base_url = f"http://{screen_ip}"

        img = generate_image(
            template_data,
            session=session,
            gov_session=gov_session,
            current_screen_id=current_screen_id,
            dummy=False,
        )

        width, height = img.size
        black_img = Image.new("1", (width, height), 1)
        red_img = Image.new("1", (width, height), 1)

        px = img.load()
        for y in range(height):
            for x in range(width):
                r, g, b = px[x, y]  # type: ignore
                if r > 150 and g < 100 and b < 100:  # red
                    red_img.putpixel((x, y), 0)
                elif r < 100 and g < 100 and b < 100:  # black
                    black_img.putpixel((x, y), 0)

        for endpoint, plane in (("upload_bw", black_img), ("upload_red", red_img)):
            r = requests.post(
                f"{base_url}/{endpoint}",
                data=plane.tobytes(),
                headers={"Content-Type": "application/octet-stream"},
            )
            print(f"{endpoint}: {r.status_code} • {r.text}")

        disp = requests.post(f"{base_url}/display")
        print(f"display: {disp.status_code} • {disp.text} • {screen_ip}")

    except Exception as e:
        print("[upload_to_esp32] ERROR:", e)


@router.post("/preview_png")
def preview_png(
    screen_template: ScreenTemplate,
    current_user: User = Depends(get_current_active_user),
):
    img = generate_image(screen_template.model_dump(), dummy=True)
    img = img.rotate(-90, expand=True)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@router.post(
    "/add_screen_template",
    response_model=ScreenTemplate,
)
def add_screen_template(
    screen_template: ScreenTemplate,
    response: Response,  # <— inject this
    current_user: User = Depends(get_current_active_user),
):
    template_name = screen_template.template_name
    json_path = os.path.join(src_directory, "screen_templates.json")

    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            existing_data = json.load(f)
    else:
        existing_data = {}

    # strip out the template_name for storage
    data_without_name = screen_template.model_dump(exclude={"template_name"})

    existed_before = template_name in existing_data
    existing_data[template_name] = data_without_name

    with open(json_path, "w") as f:
        json.dump(existing_data, f, indent=4)

    # set status based on whether it was an overwrite
    response.status_code = (
        status.HTTP_200_OK if existed_before else status.HTTP_201_CREATED
    )

    # return only the Pydantic model
    return screen_template


@router.get("/get_screen_templates")
def get_screen_templates():
    json_path = os.path.join(src_directory, "screen_templates.json")

    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            data = json.load(f)
    else:
        data = {}

    return data


@router.post("/update_display", response_model=UpdateResponse)
def update_screen_display(
    update_request: ScreenUpdateRequest,
    session: Session = Depends(get_session),
    gov_session: Session = Depends(get_gov_session),
    # current_user: User = Depends(get_current_active_user)
):
    product_id = update_request.product_id
    template_name = update_request.template_name

    product_screens = session.scalars(
        select(ProductScreen).where(ProductScreen.ProductID == product_id)
    ).all()

    if not product_screens:
        return {"message": "No product screens found for the given product ID."}

    for product_screen in product_screens:
        print(product_screen)
        current_screen_id = product_screen.ScreenID

        json_path = os.path.join(src_directory, "screen_templates.json")

        if os.path.exists(json_path):
            with open(json_path, "r") as json_file:
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
                    (ProductScreen.ScreenID == current_screen_id)
                    & (ProductScreen.ProductID == Promotions.ProductID)
                )
                .order_by(desc(Promotions.PromotionID))
            ).first()

            if (
                result
                and result.EndDate
                and result.EndDate > datetime.now().date()
                and result.Discount
                and result.Discount > 0
            ):
                template_name = "Promotion"
            else:
                template_name = "Standard"

        if template_name != "" and template_name not in screen_templates:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Screen template '{template_name}' not found.",
            )

        print(
            f"Updating screen display for product_id: {product_id}, screen_id: {current_screen_id}, template_name: {template_name}"
        )

        screen = session.exec(
            select(Screens).where(Screens.ScreenID == current_screen_id)
        ).first()
        if not screen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Screen not found.",
            )

        screen_ip = screen.IP or ""
        template_data = screen_templates[template_name]

        upload_to_esp32(
            screen_ip,
            template_data,
            session,
            gov_session,
            current_screen_id or 0,
        )

    return UpdateResponse(message="Screen updated successfully.")


@router.post("/add", response_model=Screens)
def add_screen(
    screen_add: Screens,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    screen_add.Status = "Active"
    new_screen = Screens(**screen_add.model_dump())
    session.add(new_screen)
    session.commit()
    session.refresh(new_screen)
    return new_screen


@router.get("/get", response_model=List[Screens])
def get_screens(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    linked_screen_ids = session.exec(select(ProductScreen.ScreenID)).all()
    linked_screen_ids = [
        screen_id for screen_id in linked_screen_ids if screen_id is not None
    ]
    screens = session.exec(
        select(Screens).where(Screens.ScreenID.not_in(linked_screen_ids))  # type: ignore
    ).all()
    print(screens)
    return screens


@router.get("/get/{screen_id}", response_model=Screens)
def get_screen_by_id(
    screen_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    screen = session.get(Screens, screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    return screen


@router.get("/active_screens")
def active_screens(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    linked_screen_ids = session.exec(select(ProductScreen.ScreenID)).all()
    all_screens = session.exec(select(Screens)).all()
    active_screens = [s for s in all_screens if s.ScreenID in linked_screen_ids]
    available_screens = [s for s in all_screens if s.ScreenID not in linked_screen_ids]
    return {"active": active_screens, "available": available_screens}
