# EveryCase Website

This is a working repo for the [EveryCase](https://everycase.org/).

## What's going on here

A script [table_slayer.py](scripts/table_slayer.py) is responsible for generating most of EveryCase contents from folder with SKU pages and text pages.  

## License

This project is based on Shu Ding's [Nextra](https://github.com/shuding/nextra/) / Docs template, which is licensed under the MIT Licence. The original content and modifications introduced by EveryCase have their own [loicense](LICENCE.md).

## Local Deployment

If you want to host this yourself for some reason…

1. Clone the repo.
2. Execute `pnpm i` to install the dependencies.
3. Run the server with `pnpm dev` and visit [localhost:3000](http://localhost:3000/).

## Docker Deployment

1. Clone the repo.
2. Use `docker build -t everycase .` to build the image.
3. Run the container with `docker run -d -p 80:3000 everycase` and visit [localhost:80](http://localhost/).
