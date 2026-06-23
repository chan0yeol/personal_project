from fastapi import APIRouter, HTTPException, Query
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os
from datetime import datetime, timedelta

router = APIRouter()

SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
SERVICE_ACCOUNT_FILE = 'service_account.json'

def get_service():
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        return None
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        return build('searchconsole', 'v1', credentials=creds)
    except Exception:
        return None

@router.get("/google-search-console")
async def get_gsc_data(
    site_url: str = Query(..., description="Site URL"),
    days: int = Query(7, description="Days to fetch")
):
    service = get_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service account configuration error")

    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    request = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['query', 'page'],
        'rowLimit': 100
    }

    try:
        response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
        rows = response.get('rows', [])
        result = []
        for row in rows:
            result.append({
                'keyword': row['keys'][0],
                'page': row['keys'][1],
                'clicks': row['clicks'],
                'impressions': row['impressions'],
                'ctr': round(row['ctr'] * 100, 2),
                'position': round(row['position'], 1)
            })
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))