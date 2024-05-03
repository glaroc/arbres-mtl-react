#!/bin/bash

printf -v date '%(%Y-%m-%d)T' -1 

#date='2024-01-24'

echo -e "== Downloading CSV file =="
rm -rif /tmp/arbres-publics.csv
wget -P /tmp/ https://donnees.montreal.ca/dataset/b89fd27d-4b49-461b-8e54-fa2b34a628c4/resource/64e28fe6-ef37-437a-972d-d1d3f1f7d891/download/arbres-publics.csv

echo -e "== Generate intermediate CSV file =="
rm -rif /tmp/arbres_publics_mtl.csv
docker compose run --rm spatial rm -rif /tmp/arbres_publics_mtl.csv && ogr2ogr -overwrite -clipsrc -73.95 45.4 -73.46 45.75 -f CSV -dialect SQLITE -sql "SELECT ESSENCE_ANG as essence_en, Essence_fr as essence_fr, Essence_latin as essence_latin, *, '-' || SIGLE || '-' as sp_code FROM \"arbres-publics\"" /tmp/arbres_publics_mtl.csv /tmp/arbres-publics.csv && chmod 777 /tmp/arbres_publics_mtl.csv

echo -e "== Generating GeoParquets =="
rm -rif /tmp/arbres_publics_mtl.parquet
docker compose run --rm spatial ogr2ogr -clipsrc -73.95 45.4 -73.46 45.75 -oo Y_POSSIBLE_NAMES=Latitude -oo X_POSSIBLE_NAMES=Longitude -f Parquet -s_srs EPSG:4326 -t_srs EPSG:4326 /tmp/arbres_publics_mtl.parquet /tmp/arbres_publics_mtl.csv

echo -e "== Generating GeoJSON =="
rm -rif /tmp/arbres_publics_mtl.geojson
docker compose run --rm spatial rm -rif /tmp/arbres_publics_mtl.geojson && ogr2ogr -overwrite -clipsrc -73.95 45.4 -73.46 45.75 -oo Y_POSSIBLE_NAMES=Latitude -oo X_POSSIBLE_NAMES=Longitude  -f GeoJSON -s_srs EPSG:4326 -t_srs EPSG:4326 /tmp/arbres_publics_mtl.geojson /tmp/arbres_publics_mtl.csv && chmod 777 /tmp/arbres_publics_mtl.geojson

echo -e "== Sending files to cloud =="
docker compose run --rm  spatial s5cmd cp -acl 'public-read' /tmp/arbres_publics_mtl.parquet s3://arbres/mtl/parquet/

echo -e "== Generating PMTiles file =="
docker compose run --rm spatial tippecanoe --cluster-distance=2 --cluster-maxzoom=-1 --maximum-zoom=15 -pk -x Coord_X -x Coord_Y -x CODE_PARC -x NOM_PARC -x ARROND_NOM -x EMP_NO -x Rue -x LOCALISATION -x Emplacement -x No_civique -x COTE -x LONGITUDE -x LATITUDE -x INV_TYPE -x ESSENCE_ANG -x Essence_fr -x Essence_latin -o /tmp/arbres_mtl.pmtiles --accumulate-attribute=sp_code:comma -l arbres --force /tmp/arbres_publics_mtl.geojson

echo -e "== Sending files to cloud =="
docker compose run --rm  spatial s5cmd cp -acl 'public-read' /tmp/arbres_mtl.pmtiles s3://arbres/mtl/pmtiles/

echo -e "== Generate Species and number of observations table =="
docker compose run --rm spatial /app/duckdb :memory: "COPY (SELECT SIGLE as sigle,  string_agg(DISTINCT essence_latin) as essence_latin, string_agg(DISTINCT essence_fr,',') as essence_fr, string_agg(DISTINCT essence_en,',') as essence_en, count(*) as n_trees FROM read_parquet('/tmp/arbres_publics_mtl.parquet') GROUP BY sigle ORDER BY n_trees DESC) TO '/tmp/arbres_publics_mtl_freq.json' (ARRAY true);"

echo -e "== Sending files to cloud =="
docker compose run --rm  spatial s5cmd cp -acl 'public-read' /tmp/arbres_publics_mtl_freq.json s3://arbres/mtl/pmtiles/

#echo -e "== Sending file to cloud =="
#docker compose run --rm  spatial s5cmd cp -acl public-read /tmp/atlas_datasets_${date}.json s3://bq-io/atlas/parquet/
#docker compose run --rm  spatial s5cmd cp -acl public-read /tmp/atlas_datasets_public_${date}.json s3://bq-io/atlas/parquet/

#echo -e "== Generating PMTiles file =="
#docker compose run --rm spatial tippecanoe -zg -o /tmp/atlas_${date}.pmtiles --drop-densest-as-needed --extend-zooms-if-still-dropping -l atlas -P --force /tmp/atlas_${date}.csv

#echo -e "== Sending file to cloud =="
#docker compose run --rm spatial s5cmd cp -acl acl-public /tmp/atlas_${date}.pmtiles s3://bq-io/atlas-pmtiles/
