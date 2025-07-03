# `pageview`

![](https://api.checklyhq.com/v1/badges/checks/7da0b0e8-698c-4264-86b5-4b45a139c37e?style=flat&theme=dark)

![](https://screenshotter.vercel.app/screenshot?url=https://pageview.duyet.net&viewport=1728,1117)
![](https://screenshotter.vercel.app/screenshot?url=https://pageview.duyet.net/url/2&viewport=1728,1117)

Add this snippet to your website:

```html
<script>
  !(function (e, n, t) {
    e.onload = function () {
      let e = n.createElement('script')
      ;((e.src = t), n.body.appendChild(e))
    }
  })(window, document, 'https://pageview.duyet.net/pageview.js')
</script>
```

Checkout result at: https://pageview.duyet.net

## Development

To run the development server, execute the following command:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contribute and deployment

To contribute to the project, push any changes to the `dev` branch and create a PR to merge the changes into the `main` branch.
Preview deployment can be seen on the `dev` branch.

For deployment on Vercel, follow these links for instructions:

- https://www.prisma.io/docs/guides/database/using-prisma-with-planetscale
- [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Project note

Disclaimer: This project is not intended for scale and is for personal usage only.
I may consider scaling it later on.
The main purpose of this project is to demonstrate how to use Next.js,
PlanetScale, TurboRepo, Vercel and some modern React components.

## License

MIT.
