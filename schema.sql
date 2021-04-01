DROP TABLE IF EXISTS location_info;
CREATE TABLE location_info (ID SERIAL PRIMARY KEY,
search_query VARCHAR (200),
formatted_query VARCHAR (200),
latitude NUMERIC(10, 7),
longitude NUMERIC(10, 7)
 );