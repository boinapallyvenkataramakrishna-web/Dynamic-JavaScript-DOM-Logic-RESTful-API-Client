import { fetchProducts, fetchCategories } from "./api.js";

const CACHE_KEY = "product-explorer-cache-v1";
const CART_KEY = "product-explorer-cart-v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

const elements = {
  search: document.querySelector("#search-input"),
  sort: document.querySelector("#sort-select"),
  tabs: document.querySelector("#category-tabs"),
  grid: document.querySelector("#product-grid"),
  count: document.querySelector("#results-count"),
  error: document.querySelector("#error-banner"),
  errorMessage: document.querySelector("#error-message"),
  retry: document.querySelector("#retry-button"),
  empty: document.querySelector("#empty-state"),
  clear: document.querySelector("#clear-filters"),
  cartCount: document.querySelector("#cart-count")
};

const state = {
  products: [],
  category: "all",
  query: "",
  sort: "featured",
  cart: readStorage(CART_KEY, [])
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key} from localStorage.`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key} to localStorage.`, error);
  }
}

function getCachedProducts() {
  const cache = readStorage(CACHE_KEY, null);
  if (!cache || !Array.isArray(cache.products)) return null;
  if (Date.now() - cache.savedAt > CACHE_TTL_MS) return null;
  return cache.products;
}

function setLoading() {
  elements.grid.innerHTML = Array.from({ length: 8 }, () => '<div class="skeleton" aria-hidden="true"></div>').join("");
  elements.count.textContent = "Loading products…";
  elements.empty.hidden = true;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.error.hidden = false;
}

function hideError() {
  elements.error.hidden = true;
}

function titleCase(value) {
  return value.replace(/\b\w/g, character => character.toUpperCase());
}

function renderCategories(categories) {
  const allCategories = ["all", ...categories];
  elements.tabs.replaceChildren();

  for (const category of allCategories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab${state.category === category ? " active" : ""}`;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(state.category === category));
    button.textContent = category === "all" ? "All products" : titleCase(category);
    elements.tabs.append(button);
  }
}

function getVisibleProducts() {
  let result = state.products.filter(product => {
    const matchesCategory = state.category === "all" || product.category === state.category;
    const searchText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
    return matchesCategory && searchText.includes(state.query.toLowerCase().trim());
  });

  switch (state.sort) {
    case "price-asc": result.sort((a, b) => a.price - b.price); break;
    case "price-desc": result.sort((a, b) => b.price - a.price); break;
    case "title-asc": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    case "rating-desc": result.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0)); break;
    default: result.sort((a, b) => a.id - b.id);
  }
  return result;
}

function makeProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";
  const image = document.createElement("img");
  image.className = "product-image";
  image.src = product.image;
  image.alt = product.title;
  image.loading = "lazy";
  image.addEventListener("error", () => { image.hidden = true; }, { once: true });
  imageWrap.append(image);

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = product.category;

  const title = document.createElement("h2");
  title.className = "product-title";
  title.textContent = product.title;

  const meta = document.createElement("div");
  meta.className = "product-meta";
  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price);
  const rating = document.createElement("span");
  rating.className = "product-rating";
  rating.textContent = `★ ${product.rating?.rate ?? "—"} (${product.rating?.count ?? 0})`;
  rating.setAttribute("aria-label", `Rating ${product.rating?.rate ?? "not available"} out of 5`);
  meta.append(price, rating);

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-button";
  addButton.textContent = "Add to cart";
  addButton.addEventListener("click", () => addToCart(product.id));

  article.append(imageWrap, category, title, meta, addButton);
  return article;
}

function renderProducts() {
  const products = getVisibleProducts();
  elements.grid.replaceChildren(...products.map(makeProductCard));
  elements.count.textContent = `${products.length} ${products.length === 1 ? "product" : "products"} found`;
  elements.empty.hidden = products.length !== 0;
  elements.clear.hidden = !(state.query || state.category !== "all" || state.sort !== "featured");
}

function addToCart(productId) {
  state.cart.push(productId);
  writeStorage(CART_KEY, state.cart);
  renderCartCount();
}

function renderCartCount() {
  elements.cartCount.textContent = String(state.cart.length);
}

async function loadProducts({ forceRefresh = false } = {}) {
  hideError();
  if (!forceRefresh) {
    const cached = getCachedProducts();
    if (cached) {
      state.products = cached;
      renderProducts();
      elements.count.textContent += " · cached";
      loadCategories().catch(error => console.warn("Categories could not be refreshed.", error));
      return;
    }
  }

  setLoading();
  try {
    const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
    if (!Array.isArray(products) || !Array.isArray(categories)) {
      throw new Error("The API returned data in an unexpected format.");
    }
    state.products = products;
    writeStorage(CACHE_KEY, { savedAt: Date.now(), products });
    renderCategories(categories);
    renderProducts();
  } catch (error) {
    console.error("Product loading failed:", error);
    const stale = readStorage(CACHE_KEY, null);
    if (stale && Array.isArray(stale.products)) {
      state.products = stale.products;
      renderProducts();
      showError(`${error.message} Showing saved data instead.`);
    } else {
      elements.grid.replaceChildren();
      elements.count.textContent = "Products unavailable";
      showError(error.message || "Something went wrong while loading products.");
    }
  }
}

async function loadCategories() {
  const categories = await fetchCategories();
  if (Array.isArray(categories)) renderCategories(categories);
}

elements.search.addEventListener("input", event => {
  state.query = event.target.value;
  renderProducts();
});

elements.sort.addEventListener("change", event => {
  state.sort = event.target.value;
  renderProducts();
});

elements.tabs.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  for (const tab of elements.tabs.querySelectorAll("button")) {
    const active = tab.dataset.category === state.category;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  }
  renderProducts();
});

elements.clear.addEventListener("click", () => {
  state.query = "";
  state.category = "all";
  state.sort = "featured";
  elements.search.value = "";
  elements.sort.value = "featured";
  renderCategories([...new Set(state.products.map(product => product.category))]);
  renderProducts();
});

elements.retry.addEventListener("click", () => loadProducts({ forceRefresh: true }));

renderCartCount();
loadProducts();
