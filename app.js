const puzzleContainer = document.querySelector("#puzzle-container");
const puzzleOptionsForm = document.querySelector("#puzzle-options-form");
const imageInput = document.querySelector("#puzzle-image-input");
const uploadInput = document.querySelector("#puzzle-upload-input");
const columnInput = document.querySelector("#puzzle-column-input");
const rowInput = document.querySelector("#puzzle-row-input");
const resetButton = document.querySelector("#reset-button");
const scrambleButton = document.querySelector("#scramble-button");
const initialWidth = Math.min(600, window.innerWidth);
const initialHeight = initialWidth;
const initialColumns = columnInput.value = 3;
const initialRows = rowInput.value =  3;
let currentPuzzle;

class Puzzle {
  constructor({src, rows, columns, width, height}) {
    this.src = src;
    this.rows = rows;
    this.columns = columns;
    this.width = width;
    this.height = height;
    this.tileWidth = width / columns;
    this.tileHeight = height / rows;
    this.tiles = Array.from({length: rows * columns}).map((_, i) => {
      const x = i % columns;
      const y = Math.floor(i / columns);
      return {
        x, y,
        imageX: x,
        imageY: y,
        empty: false
      };
    });
    this.emptyTile = last(this.tiles);
    this.emptyTile.empty = true;
    this.createElements();
  }

  slideTile(tile) {
    const {emptyTile} = this;
    if(!this.areTilesNeighbors(tile, emptyTile)) return;
    this.swapTiles(tile, emptyTile);
    this.updateTileElPosition(tile);
    this.updateTileElPosition(emptyTile);
  }

  swapTiles(a, b) {
    const {x: ax, y: ay} = a;
    const {x: bx, y: by} = b;
    a.x = bx;
    a.y = by;
    b.x = ax;
    b.y = ay;
  }

  reset() {
    this.tiles.forEach((tile) => {
      tile.x = tile.imageX;
      tile.y = tile.imageY;
      this.updateTileElPosition(tile);
    })
  }

  scramble() {
    const {emptyTile, elementsCreated} = this;
    let last = null;
    const isValidTile = (tile) => tile !== last && tile !== emptyTile && this.areTilesNeighbors(tile, emptyTile);

    for(let i = 0; i < 1000; i++) {
      const nextTile = last = sample(this.tiles.filter(isValidTile));
      this.swapTiles(emptyTile, nextTile);
      this.tiles.forEach((tile) => this.updateTileElPosition(tile));
    }
  }

  updateTileElPosition(tile) {
    const {tileWidth, tileHeight} = this;
    const {el, x, y} = tile;
    if(el) {
      el.style.left = `${x * tileWidth}px`;
      el.style.top = `${y * tileHeight}px`;
    }
  }

  areTilesNeighbors(a, b) {
    const {x: ax, y: ay} = a;
    const {x: bx, y: by} = b;
    return (
      (a !== b) &&
      (
        (ax === bx && (ay === by + 1 || ay === by - 1)) ||
        (ay === by && (ax === bx + 1 || ax === bx - 1))
      )
    );
  }

  createElements() {
    const {src, tiles, width, height, tileWidth, tileHeight} = this;
    const tileEls = tiles.map((tile) => {
      const {x, y, imageX, imageY, empty} = tile;
      const tileEl = createEl("div", "tile");

      Object.assign(tileEl.style, {
        "position": "absolute",
        "width": `${tileWidth}px`,
        "height": `${tileHeight}px`,
        "background-image": `url(${src})`,
        "background-size": `${width}px ${height}px`,
        "background-position": `-${imageX * tileWidth}px -${imageY * tileHeight}px`,
        "transition": "top 0.1s, left 0.1s",
        "vertical-align": "top",
        "cursor": "pointer"
      });
      if(empty) {
        tileEl.style.opacity = "0";
        tileEl.style.cursor = "default";
      }

      tileEl.addEventListener("click", this.slideTile.bind(this, tile));
      tile.el = tileEl;
      this.updateTileElPosition(tile);
      return tileEl;
    });

    const puzzleEl = this.el = createEl("div", "puzzle");

    Object.assign(puzzleEl.style, {
      position: "relative",
      width: `${width}px`,
      height: `${height}px`
    });

    tileEls.forEach((el) => puzzleEl.appendChild(el));
  }
}

function createEl(tag, ...classNames) {
  const el = document.createElement(tag);
  if(classNames.length) el.classList.add(...classNames);
  return el;
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function last(arr) {
  return arr[arr.length - 1];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image;
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function renderPuzzle(options) {
  const puzzle = currentPuzzle = new Puzzle(options);
  puzzleContainer.innerHTML = "";
  puzzleContainer.appendChild(puzzle.el);
}

renderPuzzle({src: "./cat.png", width: initialHeight, height: initialWidth, rows: initialRows, columns: initialColumns});

puzzleOptionsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const src = imageInput.value.trim();
  const columns = parseInt(columnInput.value);
  const rows = parseInt(rowInput.value);
  if(src.length) {
    loadImage(src)
      .then(({width, height}) => {
        const puzzleWidth = 600;
        const puzzleHeight = (puzzleWidth / width) * height;
        renderPuzzle({src, width: puzzleWidth, height: puzzleHeight, columns, rows});
      })
      .catch((error) => console.log(error));
  }
});

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  console.log(file)
  if(file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      imageInput.value = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

resetButton.addEventListener("click", (event) => {
  event.preventDefault();
  if(currentPuzzle) {
    currentPuzzle.reset();
  }
});

scrambleButton.addEventListener("click", (event) => {
  event.preventDefault();
  if(currentPuzzle) {
    currentPuzzle.scramble();
  }
});
