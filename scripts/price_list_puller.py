import requests
from datetime import datetime, timedelta

url_template = "https://www.apple.com/education/pricelists/pdfs/Apple_US_Education_Institution_Price_List-%m-%d-%Y.pdf"

# Start and end dates for the year 2021
start_date = datetime(2021, 1, 1)
end_date = datetime(2021, 12, 31)


# Define a function to check URL availability
def check_url(url):
    try:
        response = requests.head(url)
        return response.status_code == 200
    except requests.RequestException:
        return False


# Iterate through each date in 2021 and check the URL
current_date = start_date
while current_date <= end_date:
    url = current_date.strftime(url_template)
    if check_url(url):
        print(f"URL available for {current_date.strftime('%Y-%m-%d')}: {url}")
    # else:
    # print(f"URL not available for {current_date.strftime('%Y-%m-%d')}: {url}")
    current_date += timedelta(days=1)
