# routers/router_template.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from db.database import engine
from db.models import Products
from dependencies.auth import get_current_active_user, User  # Ensure correct import

router = APIRouter(
    prefix="/template",
    tags=["Template"],
)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session



# Endpoint template
# you can have push, get, put, delete endpoints the one down is put
@router.put("/templatey", response_model=Products) #change 'Supermarkets' to ypur response model, response_model is the response model you want to return when this endpoint is called. model can be a databse model or you can create one before the endpoint. if no respone needed to the frontend you can delete this part
def templatey(
    supermarket_update: Products, #here you will put your request model, this as example you can remove it or change the model. model can be a databse model or you can create one before the endpoint
    session: Session = Depends(get_session), # gets database session. if database not needed remove this
    current_user: User = Depends(get_current_active_user)  # gets current user based on refresh token, if no current user this endpoint cant be accessed. remove this line if security not needed
):
    # here your endpoint logic starts 
    # example 1. if only owners can edit this endpoint you type
    if current_user.Role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can edit supermarkets.",
        )
    
    # example 2. you can create a product 
    new_product = Products(
        name=supermarket_update.name,
        category=supermarket_update.category,
        price=supermarket_update.price,
        status=supermarket_update.status
    )
    session.add(new_product)
    session.commit()
    session.refresh(new_product)
    return new_product # return must be in the same model as your response model