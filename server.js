/* eslint-disable indent */
'use strict';
// Constructor
function Location(city, locationData) {
    this.search_query = city;
    this.formatted_query = locationData[0].display_name;
    this.latitude = locationData[0].lat;
    this.longitude = locationData[0].lon;
}
function Weather(data) {
    this.forecast = data.weather.description;
    this.time = data.datetime;
}
function Park(locationData) {
    this.name = locationData.fullName;
    this.address = locationData.directionsInfo;
    this.fee = locationData.fees;
    this.description = locationData.stdescriptionarVotes;
    this.url = locationData.url;
}
function Movie(locationData){
  this.title=locationData.title;
  this.overview=locationData.overview;
  this.average_votes=locationData.vote_average;
  this.total_votes=locationData.vote_count;
  this.image_url=`https://image.tmdb.org/t/p/w500${locationData.poster_path}`;
  this.popularity=locationData.popularity;
  this.released_on=locationData.release_date;
}
function Yelp(locationData){
  this.name=locationData.name;
  this.image_url=locationData.image_url;
  this.price=locationData.price;
  this.rating=locationData.rating;
  this.url=locationData.url;
}
// Defining Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
console.log(DATABASE_URL);
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
const MOVIE_API_KEY=process.env.MOVIE_API_KEY;
const YELP_API_KEY=process.env.YELP_API_KEY;
const app = express();
app.use(cors());
const pg = require('pg');
const client = new pg.Client(DATABASE_URL);
client.connect().then(() => {
    app.listen(PORT, () => console.log(`hhhhhhhhhhhhhhhhhhhhApp is listening on port ${PORT}`));
}).catch(error => {
    console.log('error', error);
});
// Routes
app.get('/', welcomePage);
app.get('/location', locationData);
app.get('/weather', weatherData);
app.get('/parks', parksData);
app.get('/movies',moviesData);
app.get('/yelp',yelpData);
app.use('*', notFound);
// function handlErrors(response) {
//     if (response.status === 500) {
//         response.status(500).send('Sorry, something went wrong');
//     }
// }
// Helpers
function welcomePage(reqeust, response) {
    response.status(200).send('Home Page Welcome to express');
}
function locationData(request, response) {

    const city = request.query.city;
    let location;
    const selectLocation = `SELECT * FROM location_info WHERE search_query=\'${city}\';`;
    client.query(selectLocation).then(result => {
      console.log(result.rows);
      if (result.rows.length > 0) {
        // location = new Location(city, result.rows[0]);
        console.log(result.rows[0]);
        console.log(location);
        response.status(200).json(result.rows[0]);
      }
      else {
        const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`;
        superagent.get(url).then(locationData => {
            console.log('hello from superaagent');
          location = new Location(city, locationData.body);
          // response.json(location);
          const insert = 'INSERT INTO location_info (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4);';
          const safeValues = [location.search_query, location.formatted_query, location.latitude, location.longitude];
          client.query(insert, safeValues).then(result => {
            response.status(200).json(location);
          });
          // handlErrors(response);
        }).catch(() => {
            response.status(500).send('Something Went Wrong');
          });

      }
    }).catch(() => {
      response.status(500).send('Something Went Wrong');
    });
  }
  function weatherData(request, response) {
    const city = request.query.search_query;
    const longitude = request.query.longitude;
    const latitude = request.query.latitude;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}`;
    let weatherArr = [];
    superagent.get(url).then(locationData => {
      locationData.body.data.map(data => {
        weatherArr.push(new Weather(data));
      });
      response.json(weatherArr);
      // handlErrors(response);
    });
    // .catch(console.error);
  }
function parksData(request, response) {
    // const longitude=request.query.longitude;
    // const latitude=request.query.latitude;
    const city = request.query.search_query;
    console.log(city);
    const url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${PARKS_API_KEY}&limit=10`;
    let parksArr = [];
    superagent.get(url).then(locationData => {
        locationData.body.data.map((element) => {
            parksArr.push(new Park(element));
        });


        response.json(parksArr);
    }).catch(console.error);
}
function moviesData(request,response){
  const city=request.query.search_query;
  const url=`https://api.themoviedb.org/4/search/movie?api_key=${MOVIE_API_KEY}&query=${city}`;
  let moviesArr = [];
  superagent.get(url).then(locationData => {
    console.log(locationData.body.results);

    moviesArr=locationData.body.results.map((data) => {
      return(new Movie(data));
    });
    response.json(moviesArr);
  }).catch(console.error);
}
function yelpData(request,response){
  const city=request.query.search_query;
  const page=request.query.page;
  let pagNum = 5;
  let beginnigPage = (page-1)*pagNum;
  const url=`https://api.yelp.com/v3/businesses/search`;
  const parameters = {
    location: city,
    categories:'Restaurants ',
    limit:5,
    offset : beginnigPage,
  };
  superagent.get(url).query(parameters)
    .set('Authorization', `Bearer ${YELP_API_KEY}`).then(locationData=>{
      let arrayOfyelp=[];
      let dataYelp=locationData.body.businesses;
      arrayOfyelp = dataYelp.map((yelp) => {

        let yelpObj = new Yelp(yelp);
        return yelpObj;
      });
      response.send(arrayOfyelp);
    }).catch(error=>{
      console.log(error);
    });
}
function notFound(request, resp) {
    resp.status(404).send('Not found');
}

