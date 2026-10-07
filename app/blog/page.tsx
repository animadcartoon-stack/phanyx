import BlogHubPage from "@/components/marketing/BlogHubPage";
import { phanyxBlogMetadata } from "@/lib/phanyx-blog-hub";

export const metadata = phanyxBlogMetadata("pt-BR");

export default function BlogPage() {
  return <BlogHubPage locale="pt-BR" />;
}
