from fastapi import FastAPI
from routers import (
    current_user,
    user_managament,
    products,
    category_management,
    supermarket_management,
    penalties,
)
from fastapi.middleware.cors import CORSMiddleware
import logging


###For removing passlib warning
logging.getLogger("passlib").setLevel(logging.ERROR)
###


app = FastAPI(
    redirect_slashes=False,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(products.router)
app.include_router(current_user.router)
app.include_router(user_managament.router)
app.include_router(category_management.router)
app.include_router(supermarket_management.router)
app.include_router(penalties.router)
