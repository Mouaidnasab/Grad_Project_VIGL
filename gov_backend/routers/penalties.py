# routers/penalties.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlmodel import Session

from db.database import gov_engine
from db.models import Penalties, PenaltyStatusEnum
from dependencies.auth import User, require_Role

router = APIRouter(
    prefix="/penalty",
    tags=["Penalties"],
)


def get_session():
    with Session(gov_engine) as session:
        yield session


@router.get("/get/", response_model=List[Penalties])
def get_penalties(
    session: Session = Depends(get_session),
):
    return session.scalars(select(Penalties)).all()


@router.get("/get/{supermarket_id}/", response_model=List[Penalties])
def get_penalty(
    supermarket_id: int,
    session: Session = Depends(get_session),
):
    penalties = session.scalars(
        select(Penalties).where(Penalties.SupermarketID == supermarket_id)
    ).all()

    if not penalties:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Penalty not found."
        )

    return penalties


@router.post("/add/")
def add_manual_penalty(
    penalty: Penalties,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"])),
):
    new_penalty = Penalties(
        ProductID=penalty.ProductID,
        Amount=penalty.Amount,
        Reason=penalty.Reason,
        IssuedDate=penalty.IssuedDate,
        LastPaymentDate=penalty.LastPaymentDate,
        SupermarketID=penalty.SupermarketID,
        Status=penalty.Status,
    )
    session.add(new_penalty)
    session.commit()
    session.refresh(new_penalty)
    return (
        {"message": "Penalty added successfully", "penalty": new_penalty},
        status.HTTP_201_CREATED,
    )


@router.put("/update_status/{penalty_id}/{new_status}/")
def update_penalty(
    penalty_id: int,
    new_status: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"])),
):
    penalty = session.get(Penalties, penalty_id)
    if not penalty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Penalty not found."
        )
    if new_status.lower() not in ["paid", "unpaid", "late"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status."
        )
    penalty.Status = PenaltyStatusEnum(new_status.lower())
    session.add(penalty)
    session.commit()
    session.refresh(penalty)
    return (
        {"message": "Penalty updated successfully", "penalty": penalty},
        status.HTTP_200_OK,
    )
