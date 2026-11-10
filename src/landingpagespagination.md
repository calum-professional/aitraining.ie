---
layout: landingpage_layout
pagination:
    data: coursesapifull.savedSearches  
    size: 1
    alias: search
permalink: "saved_searches/{{search.location | slugify | removeInvalidChars }}/{{search.keyword | slugify | removeInvalidChars}}/{{search.title | slugify | removeInvalidChars}}.html"
pageType: landing
--- 
{{ keyword | json }}
