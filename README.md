# FineWoven Empire

This is a working repo for the [FineWoven Empire](https://everycase.org/) website.

## To-do list

- Improving dataset of case images (I'm manually doing transparent backgrounds 🥲)
- More bad writing 🤗
- Small tweaks and fixes here and there

## What's going on here

A [Table Slayer](scripts/table_slayer.py) Python script is responsible for generating most of FineWoven Empire contents, using folders with [SKU pages](trash/layout/) and [text pages](trash/pages/).

## Licence

This project is based on Shu Ding's [Nextra](https://github.com/shuding/nextra/) / Docs template, which is licensed under the MIT Licence. The original content and modifications introduced by FineWoven Empire have their own [loicence](LICENCE.md).

## Local Deployment

If you want to host this yourself for some reason…

1. Clone the repo.
2. Execute `pnpm i` to install the dependencies.
3. Run the server with `pnpm dev` and visit [localhost:3000](http://localhost:3000/).

## Docker Deployment

1. Clone the repo.
2. Use `docker build -t everycase .` to build the image.
3. Run the container with `docker run -d -p 80:3000 everycase` and visit [localhost:80](http://localhost/).
