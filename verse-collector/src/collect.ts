import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import * as cheerio from "cheerio";

const CACHE_DIRECTORY =
    process.env.NODE_ENV === "development" ? "../.cache" : "./.cache";

function urlToFilename(url: string): string {
    return (
        url
            .replace(/^https?:\/\//, "") // replace http(s) with empty string
            .replace(/\//g, "_") // replace all slashes with underscores
            .replace(/\./g, "-") + ".html" // replace all dots with dashes
    );
}

// fetch html from web (or cache if it exists) and return the html string
async function fetchURL(volume: string, book: string, chapter: number, lang: string): Promise<string> {
    const url = `https://www.churchofjesuschrist.org/study/scriptures/${volume}/${book}/${chapter}?lang=${lang}`;
    const cachePath = resolve(__dirname, CACHE_DIRECTORY, lang);

    // if cache directory exists, create it
    if (!existsSync(cachePath)) mkdirSync(CACHE_DIRECTORY, { recursive: true });

    const htmlCachePath = resolve(
        __dirname,
        CACHE_DIRECTORY,
        urlToFilename(url)
    );

    // return from cache if it exists
    if (existsSync(htmlCachePath))
        return await readFile(htmlCachePath, { encoding: "utf8" });

    const html = await fetch(url).then((res) => res.text());
    if (html) await writeFile(htmlCachePath, html, { encoding: "utf8" });

    return html;
}

export default async function collect(volume: string, book: string, chapter: number, lang: string): Promise<string[]> {
    const html = await fetchURL(volume, book, chapter, lang);

    const $ = cheerio.load(html);

    const verseEls = $(".body-block p.verse");

    // remove verse numbers at the beginning
    verseEls.find(".verse-number").remove();

    // remove superscripts on verses
    verseEls.find("sup").remove();

    // remove ruby texts on verses
    verseEls.find("rt").remove();

    const verses = verseEls
        .map(function(_, el) {
            return $(el).text().trim();
        })
        .toArray();

    return verses;
}
