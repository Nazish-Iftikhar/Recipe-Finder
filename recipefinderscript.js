const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsDiv = document.getElementById('results');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close');

// 🔥 MULTI-API SUPPORT - Har tarah ka food!
const APIS = {
    // API 1: TheMealDB (International dishes)
    mealDB: 'https://www.themealdb.com/api/json/v1/1/search.php?s=',
    
    // API 2: TheMealDB - Categories (desi + international)
    category: 'https://www.themealdb.com/api/json/v1/1/filter.php?c=',
    
    // API 3: TheMealDB - Random (surprise dish)
    random: 'https://www.themealdb.com/api/json/v1/1/random.php'
};

// 🎯 Categories for quick access
const CATEGORIES = [
    'Beef', 'Chicken', 'Dessert', 'Lamb', 'Miscellaneous', 
    'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 
    'Vegetarian', 'Breakfast', 'Goat', 'Biryani', 'Curry'
];

// 🌍 Desi + International keywords
const DESI_KEYWORDS = ['biryani', 'karahi', 'nihari', 'haleem', 'korma', 'tikka', 'kebab', 'pulao', 'daal', 'chana', 'samosay', 'pakoray', 'roti', 'naan', 'halwa', 'gulab', 'jalebi'];

// Search function with MULTIPLE APIs
async function searchRecipes() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        resultsDiv.innerHTML = `<p class="no-results">🔍 Type something to search!</p>`;
        return;
    }

    resultsDiv.innerHTML = `<p class="loading">⏳ Searching for "${query}"...</p>`;

    try {
        let meals = [];
        
        // 🔥 TRY 1: Exact search in MealDB
        let res = await fetch(`${APIS.mealDB}${query}`);
        let data = await res.json();
        
        if (data.meals) {
            meals = data.meals;
        } else {
            // 🔥 TRY 2: Search by category
            for (let cat of CATEGORIES) {
                if (query.includes(cat.toLowerCase()) || cat.toLowerCase().includes(query)) {
                    let catRes = await fetch(`${APIS.category}${cat}`);
                    let catData = await catRes.json();
                    if (catData.meals) {
                        meals = catData.meals;
                        break;
                    }
                }
            }
        }

        // 🔥 TRY 3: Desi food special search
        if (!meals.length) {
            for (let keyword of DESI_KEYWORDS) {
                if (query.includes(keyword) || keyword.includes(query)) {
                    let desiRes = await fetch(`${APIS.mealDB}${keyword}`);
                    let desiData = await desiRes.json();
                    if (desiData.meals) {
                        meals = desiData.meals;
                        break;
                    }
                }
            }
        }

        // 🔥 TRY 4: Random search as last resort
        if (!meals.length) {
            let randomRes = await fetch(APIS.random);
            let randomData = await randomRes.json();
            if (randomData.meals) {
                meals = randomData.meals;
                resultsDiv.innerHTML = `
                    <p class="no-results" style="color:#ffd200;">
                        🎲 No exact match found! Here's a random recipe for you:
                    </p>
                `;
            }
        }

        if (!meals || !meals.length) {
            resultsDiv.innerHTML = `
                <p class="no-results">
                    😕 No recipes found for "${query}".<br>
                    Try: Pizza, Pasta, Biryani, Karahi, Cake, or any dish!
                </p>
            `;
            return;
        }

        displayRecipes(meals);
    } catch (error) {
        resultsDiv.innerHTML = `<p class="no-results">❌ Network error. Please try again.</p>`;
        console.error(error);
    }
}

// Display recipes
function displayRecipes(meals) {
    resultsDiv.innerHTML = meals.map(meal => `
        <div class="recipe-card" onclick="openModal('${meal.idMeal}')">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
            <div class="info">
                <h3>${meal.strMeal}</h3>
                <p>${meal.strArea || 'International'} • ${meal.strCategory || 'Dish'}</p>
                ${meal.strTags ? `<p style="color:#ffd200;font-size:12px;">🏷️ ${meal.strTags}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Open modal with full recipe
async function openModal(id) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        const meal = data.meals[0];

        // Get ingredients list
        let ingredients = '';
        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ing && ing.trim()) {
                ingredients += `<li>${measure} ${ing}</li>`;
            }
        }

        modalBody.innerHTML = `
            <h2>${meal.strMeal}</h2>
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
            <p><strong>🌍 Cuisine:</strong> ${meal.strArea || 'International'}</p>
            <p><strong>📂 Category:</strong> ${meal.strCategory || 'Dish'}</p>
            ${meal.strTags ? `<p><strong>🏷️ Tags:</strong> ${meal.strTags}</p>` : ''}
            
            <h4>🛒 Ingredients</h4>
            <ul>${ingredients}</ul>

            <h4>📖 Instructions</h4>
            <p style="color:#ccc;line-height:1.8;">${meal.strInstructions || 'No instructions available.'}</p>

            ${meal.strYoutube ? `<p><a href="${meal.strYoutube}" target="_blank" style="color:#f7971e;">▶️ Watch on YouTube</a></p>` : ''}
            
            <p style="margin-top:15px;color:#666;font-size:12px;">💡 Tip: Try searching for any food from any cuisine!</p>
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error(error);
    }
}

// Close modal
closeBtn.onclick = () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// Enter key support
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchRecipes();
});

searchBtn.addEventListener('click', searchRecipes);

// 🎯 Show some popular suggestions on load
window.onload = () => {
    resultsDiv.innerHTML = `
        <div style="text-align:center;color:#888;grid-column:1/-1;padding:30px;">
            <p style="font-size:18px;margin-bottom:10px;">🍽️ Try searching for:</p>
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                ${['Pizza', 'Pasta', 'Biryani', 'Karahi', 'Cake', 'Sushi', 'Tacos', 'Curry', 'Nihari', 'Burger'].map(item => 
                    `<span onclick="document.getElementById('searchInput').value='${item}';searchRecipes();" 
                          style="background:#2a2a2a;padding:8px 18px;border-radius:50px;cursor:pointer;color:#ffd200;border:1px solid #333;hover:background:#333;">
                        ${item}
                    </span>`
                ).join('')}
            </div>
            <p style="margin-top:20px;color:#666;font-size:14px;">✨ Pakistani, Chinese, Italian, Mexican — everything works!</p>
        </div>
    `;
};