declare module "virtual:published-pages" {
  import type { PageContent } from "./types";

  /** The pages under content/pages whose `published` is not false. */
  const pages: PageContent[];
  export default pages;
}
