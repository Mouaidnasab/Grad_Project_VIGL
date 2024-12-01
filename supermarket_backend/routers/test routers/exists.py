from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from db.models import Product, Screen, Shelf
from db.database import engine
from dependencies.auth import get_current_active_user

router = APIRouter(
    prefix="/exists",
    tags=["exists"],
    dependencies=[Depends(get_current_active_user)],  # Enforce authentication on all endpoints
)

# Request and Response Models
class ExistsRequest(BaseModel):
    entity_type: str = Field(..., pattern="^(product|shelf|screen)$")  # Restrict to valid types
    id: int

class ExistsResponse(BaseModel):
    exists: bool
    message: str

# Dependency for database session
def get_session():
    with Session(engine) as session:
        yield session

@router.post("", response_model=ExistsResponse)
async def check_exists(
    request: ExistsRequest,
    session: Session = Depends(get_session)
):
    # Determine the table to query based on the entity_type
    if request.entity_type == "product":
        item = session.exec(select(Product).where(Product.id == request.id)).first()
    elif request.entity_type == "shelf":
        item = session.exec(select(Shelf).where(Shelf.id == request.id)).first()
    elif request.entity_type == "screen":
        item = session.exec(select(Screen).where(Screen.id == request.id)).first()
    else:
        # Should never happen due to regex validation, but included for safety
        raise HTTPException(status_code=400, detail="Invalid entity_type specified")

    # Check if item exists and return the response accordingly
    if item:
        return ExistsResponse(
            exists=True,
            message=f"{request.entity_type.capitalize()} with ID {request.id} exists."
        )
    
    raise HTTPException(status_code=404, detail=f"{request.entity_type.capitalize()} with ID {request.id} not found.")
