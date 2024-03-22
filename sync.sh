#!/bin/bash
npm run build
export AWS_ACCESS_KEY_ID=NJBPPQZX7PFUBP1LH8B0
export AWS_SECRET_ACCESS_KEY=DVQZTIQYUBxqs0nwtfA4n1meL8Fv9w977pSp8Gjc
export S3_ENDPOINT_URL=https://object-arbutus.cloud.computecanada.ca
s5cmd sync --delete -acl public-read dist/ s3://bq-io/atlas/pmtiles/dashboard/