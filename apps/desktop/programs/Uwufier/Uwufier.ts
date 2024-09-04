import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig, getParameters } from "../Programs";
import { PRNG } from "@/data/PRNG";
import { unwrap } from "result";
import { isCapitalized, capitalize, isUpperCase, isLowerCase } from "./util";

// Thresholds = 0 is never, 1 is always
const NYAIFY_THRESHOLD = 0.90;
const STUTTER_THRESHOLD = 0.25;
const EMOJIFY_THRESHOLD = 0.85;

const replacementsMap: Array<[string, string]> = [
  ["small", "smol"],
  ["cute", "kawaii~"],
  ["fluff", "floof"],
  ["stupid", "baka"],
  ["what", "nani"],
  ["meow", "nya"]
];

const uwuMap: Array<[RegExp, string]> = [
  [/(?:r|l)/g, "w"],
  [/(?:R|L)/g, "W"],
  [/n([aeiou])/g, "ny$1"],
  [/N([aeiou])/g, "Ny$1"],
  [/N([AEIOU])/g, "NY$1"],
  [/ove/g, "uv"],
];

const emojiList: string[] = [
  " rawr x3",
  " OwO",
  " UwU",
  " o.O",
  " -.-",
  " >w<",
  " (⑅˘꒳˘)",
  " (ꈍᴗꈍ)",
  " (˘ω˘)",
  " (U ᵕ U❁)",
  " σωσ",
  " òωó",
  " (///ˬ///✿)",
  " (U ﹏ U)",
  " ( ͡o ω ͡o )",
  " ʘwʘ",
  " :3",
  " :3",
  " :3",
  " :3",
  " XD",
  " nyaa~~",
  " mya",
  " >_<",
  " rawr",
  " (ˆ ﻌ ˆ)♡",
  " ^•ﻌ•^",
  " /(^•ω•^)",
  " (✿oωo))"
];

function replaceWord(source: string, replacement: string, index: number, sliceLength: number): string {
  const start = source.slice(0, index);
  const end = source.slice(index + sliceLength);

  return start + replacement + end;
}
function passesThreshold(rng: PRNG, threshold: number): boolean {
  return unwrap(rng.random())! > (1 - threshold);
}

function replaceWords(words: string[], changeTracker: Set<number>): string[] {
  function formatReplacement(slice: string, replacement: string): string {
    if (isCapitalized(slice)) {
      return capitalize(replacement);
    }

    if (isUpperCase(slice)) {
      return replacement.toUpperCase();
    }

    if (isLowerCase(slice)) {
      return replacement.toLowerCase();
    }

    return replacement;
  }

  return words.map((word, index) => {
    const searchWord = word.toLowerCase();

    for (const [pattern, replacement] of replacementsMap) {
      let searchIndex = searchWord.indexOf(pattern);
      if (searchIndex < 0) { continue; }

      const slice = word.slice(searchIndex, searchIndex + pattern.length);
      const formattedReplacement = formatReplacement(slice, replacement);

      changeTracker.add(index);

      return replaceWord(word, formattedReplacement, searchIndex, slice.length);
    }

    return word;

  });
}

function nyaify(words: string[], rng: PRNG, changeTracker: Set<number>): string[] {
  return words.map((word, index) => {
    // It has already been altered earlier in the process (by replaceWords)
    // So we skip in in the nyaifying process
    if (changeTracker.has(index)) { return word; }

    for (const [pattern, replacement] of uwuMap) {
      if (!passesThreshold(rng, NYAIFY_THRESHOLD)) { continue; }

      word = word.replace(pattern, replacement);
    }

    return word;
  })
}

function stutter(words: string[], rng: PRNG): string[] {
  function formatStutter(word: string): string {
    if (word.length < 1) { return word; }

    const letter = word.charAt(0);
    const code = letter.charCodeAt(0);

    const isLetter = (code >= 65 && code < 91) || (code >= 97 && code < 123);
    if (!isLetter) { return word; }

    if (isUpperCase(word)) {
      return `${letter.toUpperCase()}-${word.toUpperCase()}`;
    }

    if (isCapitalized(word)) {
      return `${letter.toUpperCase()}-${word.toLowerCase()}`;
    }

    return `${letter}-${word}`;
  }

  return words.map((word) => {
    if (!passesThreshold(rng, STUTTER_THRESHOLD)) { return word; }

    return formatStutter(word);
  });
}

function emojify(words: string[], rng: PRNG): string[] {
  function isPunctuation(character: string): boolean {
    return [".", ",", "?", "!"].includes(character);
  }

  function canEmojify(words: string[], index: number): boolean {
    const word = words[index].trim();

    if (word.length < 1) { return false; }

    // Do not add an emoji if multiple punctuations are used at the end of a word
    const multiplePunctuation = word.length > 1 &&
      isPunctuation(word[word.length - 2]) &&
      isPunctuation(word[word.length - 1]);

    if (multiplePunctuation) { return false; }

    return isPunctuation(word[word.length - 1]);
  }

  function formatEmojify(word: string, rng: PRNG): string {
    const index = Math.floor(unwrap(rng.random(0, emojiList.length))!);
    const emoji = emojiList[index];

    const isNewLine = word[word.length - 1] === '\n';

    if (!isNewLine) { return word + emoji; }

    return word.trim() + emoji + '\r\n';
  }

  return words.map((word, index) => {
    if (!passesThreshold(rng, EMOJIFY_THRESHOLD)) { return word; }
    if (!canEmojify(words, index)) { return word; }

    return formatEmojify(word, rng);
  });
}

// Transformations based on the research of this repository
// https://github.com/Daniel-Liu-c0deb0t/uwu
/*
  there are a few transformations:

  replace some words (small -> smol, etc.)
  nya-ify (eg. naruhodo -> nyaruhodo)
  replace l and r with w
  stutter sometimes (hi -> h-hi)
  add a text emoji after punctuation (,, ., or !) sometimes
*/
function transform(text: string): string {
  const rng = new PRNG(text);
  const changeTracker = new Set<number>();
  let words = text.split(' ');

  words = replaceWords(words, changeTracker);
  words = nyaify(words, rng, changeTracker);
  words = stutter(words, rng);
  words = emojify(words, rng);

  return words.join(' ');
}

function Uwufy(shell: Shell, args: string[], apis: SystemAPIs): void {
  const text = getParameters(args).join(' ');

  shell.getTerminal().writeResponse(transform(text));
}

export class UwufierConfig implements ProgramConfig {
  public readonly appName = "uwu"
  public readonly program = Uwufy
}

export const uwuConfig = new UwufierConfig();
