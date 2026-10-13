from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path

app = FastAPI()

# Permite a comunicação com o front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caminho da planilha
ARQUIVO_EXCEL = Path(__file__).parent.parent / "dados" / "teste.xlsx"

@app.get("/")
def inicio():
    return {"mensagem": "API do planejamento industrial funcionando!"}

@app.get("/dados")
def obter_dados():
    df = pd.read_excel(ARQUIVO_EXCEL)
    df = df.astype(object).where(pd.notna(df), None)
    return df.to_dict(orient="records")
