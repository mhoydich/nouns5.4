function segmentWidth(left, count, right) {
  const available = right - left;
  return count <= available ? count : available;
}

function decodePart(part) {
  const source = part.data.replace(/^0x/, "");
  const bounds = {
    top: Number.parseInt(source.slice(2, 4), 16),
    right: Number.parseInt(source.slice(4, 6), 16),
    bottom: Number.parseInt(source.slice(6, 8), 16),
    left: Number.parseInt(source.slice(8, 10), 16),
  };
  const rects = source
    .slice(10)
    .match(/.{1,4}/g)
    ?.map((chunk) => [Number.parseInt(chunk.slice(0, 2), 16), Number.parseInt(chunk.slice(2, 4), 16)]) ?? [];

  return { bounds, rects };
}

export function buildSVG(parts, palette, background) {
  const svg = parts.reduce((markup, part) => {
    const rectMarkup = [];
    const { bounds, rects } = decodePart(part);

    let left = bounds.left;
    let top = bounds.top;

    rects.forEach(([count, paletteIndex]) => {
      let remaining = count;
      const fill = palette[paletteIndex];

      while (remaining > 0) {
        const width = segmentWidth(left, remaining, bounds.right);

        if (paletteIndex !== 0) {
          rectMarkup.push(
            `<rect width="${10 * width}" height="10" x="${10 * left}" y="${10 * top}" fill="#${fill}" />`,
          );
        }

        left += width;
        remaining -= width;

        if (left === bounds.right) {
          left = bounds.left;
          top += 1;
        }
      }
    });

    return markup + rectMarkup.join("");
  }, `<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#${background}" />`);

  return `${svg}</svg>`;
}
