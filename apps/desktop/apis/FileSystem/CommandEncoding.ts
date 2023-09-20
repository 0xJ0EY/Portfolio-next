export const Slash = '\\';
export const Space = ' ';
export const DoubleQuote = '"';
export const SingleQuote = '\'';

function findEndOfQuote(command: string, start: number, type: 'double' | 'single') {
  let index = start + 1;

  loop: while (index < command.length) {
    const char = command[index];
    index++;

    switch (char) {
      case Slash: { index++; continue loop; }
      case DoubleQuote:
      case SingleQuote: {
        if (type === 'double' || type === 'single') {
          return index;
        }
      }
    }
  }

  return index;
}

export function parseCommand(command: string): string[] {
  let parts: string[] = [];
  let index = 0;
  let chars: string[] = [];

  loop: while (index < command.length) {
    const char = command[index];

    switch (char) {
      case Slash: {
        const escapedChar = command[index + 1];
        if (escapedChar) { chars.push(escapedChar); }

        index += 2;
        continue loop;
      }
      case Space: {
        if (chars.length > 0) {
          parts.push(chars.join(''));
          chars = [];
        }

        index += 1;
        continue loop;
      }
      case DoubleQuote:
      case SingleQuote: {
        const endOfQuote = findEndOfQuote(command, index, char === DoubleQuote ? 'double' : 'single');

        // Only get the content between the quotes
        // If nothing is in the chars buffer yet, handle it as an escaped command
        const sliceStart = chars.length === 0 ? index + 1 : index;
        const sliceEnd = chars.length === 0 ? endOfQuote - 1 : endOfQuote;

        const content = command.slice(sliceStart, sliceEnd);

        for (const char of content) {
          chars.push(char);
        }

        index = endOfQuote;

        continue loop;
      }
    }

    chars.push(char);
    index++;
  }

  if (chars.length > 0) {
    parts.push(chars.join(''));
  }

  return parts;
}
