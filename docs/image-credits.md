# Image credits

Product photography lives in `frontend/public/products/`, the login backdrop in
`frontend/public/brand/cafe-interior.jpg`.

## Unsplash

The following photos are used under the [Unsplash License](https://unsplash.com/license),
cropped to 4:3 and resized for the demo catalog.

| File | Photographer | Source |
|------|--------------|--------|
| `products/americano.jpg` | Nathan Dumlao | https://unsplash.com/photos/1514432324607-a09d9b4aefdd |
| `products/cappuccino.jpg` | Sincerely Media | https://unsplash.com/photos/1572442388796-11668a67e53d |
| `products/croissant.jpg` | Mae Mu | https://unsplash.com/photos/1555507036-ab1f4038808a |
| `products/espresso.jpg` | Brian Legate | https://unsplash.com/photos/1510707577719-ae7c14805e3a |
| `products/french-fries.jpg` | Ricardo Esquivel | https://unsplash.com/photos/1573080496219-bb080dd4f877 |
| `products/hot-chocolate.jpg` | Tetiana Bykovets | https://unsplash.com/photos/1542990253-0d0f5be5f0ed |
| `products/latte.jpg` | Nathan Dumlao | https://unsplash.com/photos/1541167760496-1628856ab772 |
| `products/lemon-tea.jpg` | Anton Darius | https://unsplash.com/photos/1556881286-fc6915169721 |
| `products/lychee-tea.jpg` | Arisa Chattasa | https://unsplash.com/photos/1556679343-c7306c1976bc |
| `products/matcha-latte.jpg` | Matcha & CO | https://unsplash.com/photos/1515823064-d6e0c04616a7 |
| `products/mocha.jpg` | Louis Hansel | https://unsplash.com/photos/1578314675249-a6910f80cc4e |
| `brand/cafe-interior.jpg` | nrd | https://unsplash.com/photos/1453614512568-c4024d13c247 |

Unsplash photo URLs are resolved through `images.unsplash.com`, so the IDs above
are the stable references used at download time.

## Wikimedia Commons

`products/chocolate-croissant.jpg` is a crop of **"Pain au chocolat Luc Viatour"**
by Luc Viatour, licensed under
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
Source: https://commons.wikimedia.org/wiki/File:Pain_au_chocolat_Luc_Viatour.jpg

The cropped version distributed here is shared under the same CC BY-SA 3.0
license. No other files are adapted from Wikimedia Commons.

## Replacing demo photos

The catalog photos are matched by product name in
`frontend/src/components/shared/product-thumb.tsx`. Products can override the
built-in photo with `image_url` in the product form; the seeder also writes these
paths to the demo database.
