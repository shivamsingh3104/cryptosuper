import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "../config/api";

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/pages/${slug}`)
      .then(res => res.json())
      .then(data => setPage(data));
  }, [slug]);

  if (!page) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{page.title}</h1>
      <div>{page.content}</div>
    </div>
  );
}