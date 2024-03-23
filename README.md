# FineWoven Empire

This is a working repo for the [FineWoven Empire](https://everycase.org/) website.

## To-do list

- Improving dataset of case images (I'm manually doing transparent backgrounds 🥲)
- More bad writing 🤗
- Small tweaks and fixes here and there

## What's going on here

A [Table Slayer](scripts/table_slayer.py) Python script is responsible for generating most of FineWoven Empire contents, using folders with [SKU pages](trash/layout/), [text pages](trash/pages/), and image files (they are stored in S3; the script relies on them in order to generate pages, too).

The website is frontend-only. Which, in the hindsight, was not a good idea.

I've heavily outdesigned myself on this one, and then I took a break of 6 months and forgot all the dirty hacks used during the generation, so I'm afraid this is the final form of FineWoven Empire. I will only add new collections from now on, I guess. Or not. We'll see!

## Licence

This project is based on Shu Ding's [Nextra](https://github.com/shuding/nextra/) / Docs template, which is licensed under the MIT Licence. The original content and modifications introduced by FineWoven Empire have their own [loicense](LICENCE.md).
