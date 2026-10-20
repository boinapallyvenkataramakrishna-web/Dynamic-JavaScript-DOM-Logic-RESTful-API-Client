const API_BASE = "https://fakestoreapi.com";

/**
 * Fetch JSON with a timeout and useful errors.
 * @param {string} url
 * @returns {Promise<unknown>}
 */
async function requestJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`The server responded with ${response.status}.`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The request timed out. Check your connection and try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Network error. Check your internet connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchProducts() {
  return requestJson(`${API_BASE}/products`);
}

export async function fetchCategories() {
  return requestJson(`${API_BASE}/products/categories`);
}
