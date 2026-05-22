#!/bin/bash

printf -v date '%(%Y-%m-%d)T' -1 

#date='2024-01-24'

echo -e "== Downloading CSV file =="
rm -rif /tmp/arbres-publics-qc.csv
wget -P /tmp/ https://www.donneesquebec.ca/recherche/dataset/34103a43-3712-4a29-92e1-039e9188e915/resource/13a51853-a5b5-4add-8791-02ccba5c1be7/download/vdq-arbrerepertorie.csv -O /tmp/arbres-publics-qc.csv

echo -e "== Generate intermediate CSV file =="
rm -rif /tmp/arbres_publics_qc.csv 
ogr2ogr -overwrite -clipsrc -73.95 45.4 -73.46 45.75 -f CSV -dialect SQLITE -sql "SELECT
  NOM_FRANCAIS as essence_en,
  NOM_FRANCAIS as essence_fr,
  NOM_LATIN as essence_latin,
  DATE_PLANTE as Date_Plantation,
  DIAMETRE as DHP,
  '-' || UPPER(REPLACE(REPLACE(NOM_FRANCAIS,' ','_'),\"'\",\"\")) || '-' as sp_code,
  *
FROM \"arbres-publics-qc\"" /tmp/arbres_publics_qc.csv /tmp/arbres-publics-qc.csv   && chmod 777 /tmp/arbres_publics_qc.csv

echo -e "== Generating GeoParquets =="
rm -rif /tmp/arbres_publics_qc.parquet
ogr2ogr -clipsrc -71.5 46.5 -71 47 -oo Y_POSSIBLE_NAMES=Latitude -oo X_POSSIBLE_NAMES=Longitude -f Parquet -s_srs EPSG:4326 -t_srs EPSG:4326 /tmp/arbres_publics_qc.parquet /tmp/arbres_publics_qc.csv

echo -e "== Generating GeoJSON =="
rm -rif /tmp/arbres_publics_qc.geojson
rm -rif /tmp/arbres_publics_qc.geojson && ogr2ogr -overwrite -clipsrc -71.5 46.5 -71 47 -oo Y_POSSIBLE_NAMES=Latitude -oo X_POSSIBLE_NAMES=Longitude  -f GeoJSON /tmp/arbres_publics_qc.geojson /tmp/arbres_publics_qc.csv && chmod 777 /tmp/arbres_publics_qc.csv /tmp/arbres_publics_qc.geojson

echo -e "== Sending files to cloud =="
s5cmd cp -acl 'public-read' /tmp/arbres_publics_qc.parquet s3://arbres/qc/parquet/

echo -e "== Generating PMTiles file =="
tippecanoe --cluster-distance=2 --cluster-maxzoom=-1 --maximum-zoom=15 -pk -x TYPE_ARBRE -x MULTI_TRONC -x NOM_LATIN -x NOM_FRANCAIS -x POSITION_MESURE -x TYPE_PROP -x TYPE_LIEU -x NOM_TOPOGRAPHIE -x LONGITUDE -x LATITUDE -x DIAMETRE -x DATE_PLANTE -o /tmp/arbres_qc.pmtiles --accumulate-attribute=sp_code:comma -l arbres --force /tmp/arbres_publics_qc.geojson

echo -e "== Sending files to cloud =="
s5cmd cp -acl 'public-read' /tmp/arbres_qc.pmtiles s3://arbres/qc/pmtiles/

echo -e "== Generate Species and number of observations table =="
./duckdb :memory: "COPY (SELECT replace(sp_code,'-','') as sigle,  string_agg(DISTINCT essence_latin) as essence_latin, string_agg(DISTINCT essence_fr,',') as essence_fr, string_agg(DISTINCT essence_en,',') as essence_en, count(*) as n_trees FROM read_parquet('/tmp/arbres_publics_qc.parquet') GROUP BY sigle ORDER BY n_trees DESC) TO '/tmp/arbres_publics_qc_freq.json' (ARRAY true);"

echo -e "== Sending files to cloud =="
s5cmd cp -acl 'public-read' /tmp/arbres_publics_qc_freq.json s3://arbres/qc/pmtiles/

#echo -e "== Sending file to cloud =="
#docker compose run --rm  spatial s5cmd cp -acl public-read /tmp/atlas_datasets_${date}.json s3://bq-io/atlas/parquet/
#docker compose run --rm  spatial s5cmd cp -acl public-read /tmp/atlas_datasets_public_${date}.json s3://bq-io/atlas/parquet/

#echo -e "== Generating PMTiles file =="
#docker compose run --rm spatial tippecanoe -zg -o /tmp/atlas_${date}.pmtiles --drop-densest-as-needed --extend-zooms-if-still-dropping -l atlas -P --force /tmp/atlas_${date}.csv

#echo -e "== Sending file to cloud =="
#docker compose run --rm spatial s5cmd cp -acl acl-public /tmp/atlas_${date}.pmtiles s3://bq-io/atlas-pmtiles/
