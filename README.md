# Dynamic JavaScript DOM Logic & RESTful API Client

A responsive product explorer built with vanilla JavaScript ES modules. It demonstrates asynchronous REST calls, client-side search/filter/sort, loading skeletons, error recovery, and localStorage caching.

## Features

- `async`/`await` API client in `js/api.js` using the public Fake Store API.
- Modular UI and state logic in `js/app.js`.
- Live search across product title, description, and category.
- Category tabs and sorting by price, name, and rating.
- Ten-minute product cache in `localStorage`; cart item count persists across refreshes.
- Loading skeletons, timeout handling, friendly error banner, retry button, and stale-cache fallback.
- Responsive layout, semantic HTML, accessible labels and live regions, reduced-motion support.

## Run locally

ES modules and `fetch` should be served over HTTP rather than opened as a `file://` URL.

### Option A: Python

```bash
python -m http.server 8000
```

Open <http://localhost:8000> in your browser.

### Option B: VS Code

Install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.

## Project structure

```text
dynamic-rest-api-client/
├── index.html
├── styles.css
├── README.md
└── js/
    ├── api.js
    └── app.js
```

## API endpoints

- `GET https://fakestoreapi.com/products`
- `GET https://fakestoreapi.com/products/categories`

No API key is required. The browser needs internet access to load the API and product images.

## Verify the expected proof

1. Load the page and confirm product cards populate.
2. Type into search; cards should filter without reloading the page.
3. Choose a category and a sort order.
4. Add products to cart and refresh; the cart count should persist.
5. In DevTools → Application/Storage → Local Storage, inspect `product-explorer-cache-v1` and `product-explorer-cart-v1`.
6. Disconnect from the internet and refresh after the cache has been created to verify stale-cache fallback (browser/API behavior may vary).

## Publish to GitHub

Create an empty repository on GitHub, then run these commands from this project folder:

```bash
git init
git add .
git commit -m "Build dynamic REST API product explorer"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL. A repository is not published until you run the push command with your GitHub account authenticated.
