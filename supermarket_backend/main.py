from fastapi import FastAPI
from routers import user, assign, info, exists
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

from db.database import create_db_and_tables 



###For removing passlib warning
import logging
logging.getLogger('passlib').setLevel(logging.ERROR)
###


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"       # Match Flutter origin on 127.0.0.1
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user.router)

# in test routers folder
# app.include_router(info.router)
# app.include_router(assign.router)
# app.include_router(exists.router)



# if __name__ == "__main__":
#     create_db_and_tables()
#     uvicorn.run(app, host="0.0.0.0", port=8000)

# to run the server (cd supermarket_backend) and then use (uvicorn main:app --reload)