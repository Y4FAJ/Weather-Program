import requests
city = input("\nEnter a city: ").lower()
url = ("https://geocoding-api.open-meteo.com/v1/search?name=" + city)
response = requests.get(url) #retrieves the JSON file stored at the link
data = response.json() #converts from JSON into python dictionary
if "results" not in data:
    print("Invalid city")
else:
    latitude = data["results"][0]["latitude"]
    longitude = data["results"][0]["longitude"] #saves latitude and longitude values from first API/link
    weather_url = (
    "https://api.open-meteo.com/v1/forecast?"
    "latitude=" + str(latitude) +
    "&longitude=" + str(longitude) +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code") #the weather variables i want from the location
    weather_response = requests.get(weather_url)
    weather = weather_response.json()
    print("\nWeather for",data["results"][0]["name"],"\nTemperature:",weather["current"]["temperature_2m"],weather["current_units"]["temperature_2m"],"\nHumidity:",weather["current"]["relative_humidity_2m"],weather["current_units"]["relative_humidity_2m"],"\nWind speed:",weather["current"]["wind_speed_10m"],weather["current_units"]["wind_speed_10m"])
    time = weather["current"]["time"] #gets time + date for when data last updated
    weather_code = weather["current"]["weather_code"]
    weather_codes = {     #dictionary for possible values of the weather code and what they represent
        0: "Clear skies",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast"
    }
    print(weather_codes[weather_code])
    print("Data last updated at",time[11:]) #only prints the time rather then the date + time