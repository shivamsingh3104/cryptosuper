import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "../config/api";

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    fetch(`${API}/api/pages/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setPage(data);
      })
      .catch(() => {
        if (mounted) setPage(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center px-4">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 text-[#1b2559] font-semibold">
          Loading...
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center px-4">
        <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-[#1b2559]">Page not found</h2>
          <p className="text-sm text-[#6b7280] mt-2">
            This slug does not have any published content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f2a] text-white">

      {/* 🔥 HERO SECTION (GRADIENT) */}
      <section className="bg-gradient-to-r from-[#020617] via-[#020617] to-[#0a0f3c] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400 mb-3">
              /page/{page.slug}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
              {page.title}
            </h1>
          </div>
        </div>
      </section>

      {/* 🔥 CONTENT SECTION (NO BOX, CLEAN) */}
      <main className="bg-white text-gray-800">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
    <article
      className="max-w-none leading-relaxed space-y-4"
      dangerouslySetInnerHTML={{
        __html: typeof page.content === "string" ? page.content : "",
      }}
    />
  </div>
</main>

      <div className="h-10 sm:h-16" />
    </div>
  );
}