import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Center, Container, Loader, Text, Title } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { motion, useScroll, useTransform } from "framer-motion";
import Hero from "../components/features/Hero";
import HomeProductStrip from "../components/features/HomeProductStrip";
import MyWardrobe from "../components/features/MyWardrobe";
import { productsApi } from "../api/client";
import type { Product } from "../types";
import { getServerUrl } from "../utils/serverUrl";
import { sectionTitleStyle, smallLabelStyle } from "../theme";
import { aggregateCategoryCounts } from "../utils/categoryUtils";
import { navigateToStore } from "../utils/navigation";
import { shuffleArray } from "../utils/productUtils";

const HOME_STRIP_SIZE = 4;
const baseImgUrl = `${getServerUrl()}/images`;

const pickProducts = (products: Product[], count: number, offset = 0) =>
  products.length ? Array.from({ length: count }, (_, i) => products[(offset + i) % products.length]) : [];

type Category = { name: string; image: string; product_count: number };

const statsData = [
  { num: "400+", label: "Benzersiz Parça" },
  { num: "25", label: "Yıllık Deneyim" },
  { num: "11", label: "Kategori" },
];

const categoryImages: Record<string, string> = {
  ayakkabı: "shoes.jpg",
  gömlek: "shirt.jpg",
  top: "blouse.jpg",
  elbise: "dress.jpg",
  jean: "jeans.jpg",
  pantolon: "pants.jpg",
  etek: "skirt.jpg",
  çanta: "bag.jpg",
  aksesuar: "accesories.jpg",
  aksesuarlar: "accesories.jpg",
  "kaban ve ceket": "jacket.jpg",
  "kazak ve hırka": "jumper.jpg"
};



const BackgroundParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const points = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.3, op: Math.random() * 0.45 + 0.1, pulse: Math.random() * Math.PI * 2,
    }));

    let t = 0, animId: number;
    const draw = () => {
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      t += 0.016;

      Array.from({ length: 4 }).forEach((_, w) => {
        ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.38 + w * 50);
        for (let x = 0; x <= canvas.width; x += 3) {
          const y = canvas.height * 0.38 + w * 50 + Math.sin(x * 0.007 + t * 0.38 + w * 1.1) * 24 + Math.sin(x * 0.013 + t * 0.22 - w * 0.8) * 14;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.035 - w * 0.006})`; ctx.lineWidth = 0.8; ctx.stroke();
      });

      points.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.01;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.op * (0.7 + 0.3 * Math.sin(p.pulse))})`; ctx.fill();

        points.slice(i + 1).forEach((q) => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= 85) return;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(255,255,255,${0.055 * (1 - dist / 85)})`; ctx.lineWidth = 0.35; ctx.stroke();
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 1 }} />;
};

const MarqueeTicker = () => {
  const words = ["Zamansız Tasarım", "Yüksek Kalite", "Özgün Stil", "Sürdürülebilir Moda", "Elegance Redefined", "Timeless Collection", "Minimal Luxury", "Statement Pieces"];
  const text = [...words, ...words].join(" · ");
  return (
    <Box bg="white" py={10} style={{ borderBlock: "1px solid #e8e8e8", overflow: "hidden", whiteSpace: "nowrap" }}>
      <motion.div animate={{ x: [0, "-50%"] }} transition={{ duration: 45, ease: "linear", repeat: Infinity }} style={{ display: "inline-block" }}>
        <Text component="span" c="#111" fw={500} style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" }}>
          {text} &nbsp;&nbsp;&nbsp; {text}
        </Text>
      </motion.div>
    </Box>
  );
};

const StatsSection = () => {
  const [counts, setCounts] = useState<string[]>(statsData.map(i => i.num));
  const ref = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || triggered.current) return;
      triggered.current = true;

      statsData.forEach((item, index) => {
        const target = parseFloat(item.num.replace(/[^0-9.]/g, ""));
        const suffix = item.num.replace(/[0-9.]/g, "");
        let current = 0, step = target / 55;

        const id = setInterval(() => {
          current = Math.min(current + step, target);
          setCounts(prev => {
            const next = [...prev];
            next[index] = current >= target ? item.num : `${Math.round(current)}${suffix}`;
            return next;
          });
          if (current >= target) clearInterval(id);
        }, 22);
      });
    }, { threshold: 0.4 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={ref} pos="relative" bg="#0a0a0a" py={{ base: 28, md: 36 }} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <BackgroundParticleCanvas />
      <Container size="xl" pos="relative" style={{ zIndex: 2 }}>
        <Box style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(255,255,255,0.07)" }}>
          {statsData.map((item, idx) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: idx * 0.1 }} viewport={{ once: true }} style={{ background: "#0a0a0a", padding: "22px 0", textAlign: "center" }}>
              <Text c="white" mb={6} ff='"Playfair Display", serif' style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 200, letterSpacing: 2, lineHeight: 1 }}>{counts[idx]}</Text>
              <Text c="rgba(255,255,255,0.35)" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>{item.label}</Text>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

const EditorialSection = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yLeft = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yRight = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  const goCategory = (cat: string) => navigate(`/store?category=${encodeURIComponent(cat)}`);

  return (
    <Box ref={ref} bg="white" style={{ overflow: "hidden" }}>
      <Container size="xl" py={60}>

        <Box style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 2, background: "rgba(0,0,0,0.1)" }}>
          <motion.div style={{ y: yLeft }}>
            <Box onClick={() => goCategory("Elbiseler")} style={{ minHeight: 520, cursor: "pointer", position: "relative", overflow: "hidden" }}>
              <Box style={{ position: "absolute", inset: 0, backgroundImage: `url('${baseImgUrl}/dress.jpg')`, backgroundSize: "cover", backgroundPosition: "center top" }} />
              <Box style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.88) 100%)" }} />
              <motion.div animate={{ opacity: [0.03, 0.07, 0.03] }} transition={{ duration: 4, repeat: Infinity }} style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.04) 40px)", pointerEvents: "none" }} />
              <Box p="52px 48px" style={{ position: "relative", zIndex: 1, minHeight: 520, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <Text mb={16} c="rgba(255,255,255,0.4)" style={smallLabelStyle}>Öne Çıkan</Text>
                <Title order={3} c="white" mb={20} style={{ ...sectionTitleStyle, fontSize: 42, whiteSpace: "pre-line" }}>{"Sezonun\nSesli Parçası"}</Title>
                <Text mb={32} c="rgba(255,255,255,0.5)" style={{ fontSize: 13, lineHeight: 1.8, maxWidth: 320 }}>Koleksiyonumuzdan bu sezon en çok konuşulan tasarım. Sadelik içinde güç.</Text>
                <motion.div whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Text c="white" style={{ ...smallLabelStyle, display: "inline-flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 4 }}>Koleksiyonu Gör <span>→</span></Text>
                </motion.div>
              </Box>
            </Box>
          </motion.div>

          <Box style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <motion.div style={{ y: yRight }}>
              <Box onClick={() => goCategory("Ceketler & Kabanlar")} bg="#f5f4f0" p="40px 36px" style={{ minHeight: 260, cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden" }}>
                <Text mb={12} c="rgba(0,0,0,0.3)" style={smallLabelStyle}>Editörün Seçimi</Text>
                <Title order={3} mb={16} style={{ ...sectionTitleStyle, fontSize: 28, letterSpacing: 2, whiteSpace: "pre-line" }}>{"Minimal\nAma Güçlü"}</Title>
                <Text c="rgba(0,0,0,0.45)" style={{ fontSize: 12, lineHeight: 1.7 }}>Her detayın hesaplanmış olduğu, sezonun vazgeçilmezi.</Text>
              </Box>
            </motion.div>

            <motion.div style={{ y: yRight }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <Box style={{ minHeight: 260, position: "relative", overflow: "hidden" }}>
                <Box style={{ position: "absolute", inset: 0, backgroundImage: `url('${baseImgUrl}/jacket.jpg')`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <Box style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.82) 100%)" }} />
                <Box p="40px 36px" style={{ position: "relative", zIndex: 1, minHeight: 260, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Text ff='"Playfair Display", serif' style={{ position: "absolute", bottom: -20, right: 16, fontSize: 140, fontWeight: 200, color: "rgba(255,255,255,0.04)", lineHeight: 1, pointerEvents: "none", userSelect: "none", letterSpacing: -4 }}>26</Text>
                  <Text c="rgba(255,255,255,0.3)" style={smallLabelStyle}>2026 Koleksiyonu</Text>
                  <Box>
                    <Text mb={20} c="rgba(255,255,255,0.45)" style={{ fontSize: 13, lineHeight: 1.9 }}>Yeni sezonda stili yeniden tanımlayan parçalar seçilmeyi bekliyor.</Text>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigateToStore(navigate)} style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.2)", padding: "12px 28px", cursor: "pointer", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#fff" }}>Tümünü İncele</motion.div>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

const CategoriesSection = ({ categories, loading }: { categories: Category[]; loading: boolean }) => {
  const navigate = useNavigate();
  const openCategory = (name: string) => { navigate(`/store?category=${encodeURIComponent(name)}`); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <Box bg="#f5f4f0" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <Container size="xl" py={{ base: 56, md: 80 }} id="categories">
        <Box mb={{ base: 36, md: 52 }} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}>
            <Text mb={10} c="rgba(0,0,0,0.35)" style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase" }}>Koleksiyon</Text>
            <Title order={2} style={{ ...sectionTitleStyle, fontSize: "clamp(32px, 5vw, 52px)" }}>Kategoriler</Title>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }} style={{ maxWidth: 280 }}>
            <Text c="rgba(0,0,0,0.45)" style={{ fontSize: 13, lineHeight: 1.8, letterSpacing: 0.3 }}>Her kategori, zamansız parçalardan oluşan özenle seçilmiş bir dünya.</Text>
          </motion.div>
        </Box>

        {loading ? <Center py={48}> <Loader color="black" /> </Center> : (
          <Carousel slideSize={{ base: "72%", sm: "48%", md: "32%", lg: "22%" }} slideGap={2} withControls controlSize={36} styles={{ control: { background: "#111", color: "#fff", border: "none", opacity: 0.9 }, controls: { gap: 8 } }}>
            {[...categories].sort((a, b) => b.product_count - a.product_count).map((category, idx) => (
              <Carousel.Slide key={category.name}>
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: idx * 0.04 }} viewport={{ once: true }}>
                  <Box className="category-card" onClick={() => openCategory(category.name)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
                    <Box style={{ position: "relative", aspectRatio: "3 / 4", overflow: "hidden", background: "#e8e6e1" }}>
                      <motion.div style={{ position: "absolute", inset: 0, backgroundImage: `url('${category.image}')`, backgroundSize: "cover", backgroundPosition: "center top" }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} />
                      <Box className="category-card-overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
                      <Text style={{ position: "absolute", bottom: 14, left: 16, ...smallLabelStyle, color: "rgba(255,255,255,0.7)" }}>{category.product_count} parça</Text>
                    </Box>
                    <Box px={4}>
                      <Title order={4} mb={6} style={{ ...sectionTitleStyle, fontSize: 15, letterSpacing: 3, color: "#111" }}>{category.name.toLocaleUpperCase("tr-TR")}</Title>
                      <Text c="rgba(0,0,0,0.4)" style={{ ...smallLabelStyle, fontSize: 9 }}>Keşfet →</Text>
                    </Box>
                  </Box>
                </motion.div>
              </Carousel.Slide>
            ))}
          </Carousel>
        )}
      </Container>
    </Box>
  );
};

const STORY_VIDEO_FALLBACK = "grid_video_1.mp4";

const storyVideos = [
  { file: "grid_video_1.mp4", label: "Koleksiyon" },
  { file: "grid_video_2.mp4", label: "Doku" },
  { file: "grid_video_3.mp4", label: "Sahne" },
  { file: "grid_video_4.mp4", label: "Detay" },
  { file: "grid_video_5.mp4", label: "Atmosfer" },
];

const storyMosaicSlots = [
  { col: "1 / 3", row: "1 / 5", sh: "portrait" },
  { col: "3 / 7", row: "1 / 3", sh: "landscape" },
  { col: "3 / 5", row: "3 / 5", sh: "square" },
  { col: "5 / 7", row: "3 / 5", sh: "square" },
  { col: "1 / 7", row: "5 / 7", sh: "landscape-wide" },
] as const;

const StoryVideoTile = ({ file, label, compact }: { file: string; label: string; compact?: boolean }) => {
  const base = getServerUrl();
  const [src, setSrc] = useState(`${base}/videos/${file}`);
  return (
    <Box className="story-video-frame" style={{ position: "relative", overflow: "hidden", width: "100%", height: compact ? "100%" : undefined, aspectRatio: compact ? undefined : "1 / 1", background: "#e8e6e1", border: "1px solid rgba(0,0,0,0.08)" }}>
      <video autoPlay loop muted playsInline onError={() => { const fb = `${base}/videos/${STORY_VIDEO_FALLBACK}`; if (src !== fb) setSrc(fb); }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
        <source src={src} type="video/mp4" key={src} />
      </video>
      {!compact && (
        <Box style={{ position: "absolute", bottom: 10, left: 10, padding: "6px 10px", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <Text style={{ ...smallLabelStyle, fontSize: 8, color: "rgba(0,0,0,0.45)" }}>{label}</Text>
        </Box>
      )}
    </Box>
  );
};

const StorySection = () => {
  const navigate = useNavigate();

  return (
    <Box bg="white" py={{ base: 72, md: 100 }} style={{ borderTop: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
      <Container size="xl">
        <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48, alignItems: "center" }}>
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} style={{ display: "flex", justifyContent: "center" }}>
            <Box hiddenFrom="sm" w="100%" maw={400} mx="auto">
              <Box className="story-video-mosaic" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "repeat(6, 1fr)", gap: 8, aspectRatio: "1/1" }}>
                {storyMosaicSlots.map((slot, idx) => (
                  <motion.div key={storyVideos[idx].file} className="story-video-mosaic-item" data-shape={slot.sh} style={{ gridColumn: slot.col, gridRow: slot.row }} initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: idx * 0.07 }} viewport={{ once: true }}>
                    <StoryVideoTile file={storyVideos[idx].file} label={storyVideos[idx].label} compact />
                  </motion.div>
                ))}
              </Box>
            </Box>
            <Box visibleFrom="sm" w="100%">
              <Box className="story-video-mosaic" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "repeat(6, 1fr)", gap: 8, aspectRatio: "1/1" }}>
                {storyMosaicSlots.map((slot, idx) => (
                  <motion.div key={storyVideos[idx].file} className="story-video-mosaic-item" data-shape={slot.sh} style={{ gridColumn: slot.col, gridRow: slot.row }} initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: idx * 0.07 }} viewport={{ once: true }}>
                    <StoryVideoTile file={storyVideos[idx].file} label={storyVideos[idx].label} compact />
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.75, delay: 0.08 }} viewport={{ once: true }}>
            <Text mb={12} c="rgba(0,0,0,0.35)" style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase" }}>Marka hikayesi</Text>
            <Title order={2} mb={24} style={{ ...sectionTitleStyle, fontSize: "clamp(32px, 5vw, 52px)" }}>Kendini<br />Keşfet</Title>
            <Box mb={28} style={{ width: 48, height: 1, background: "linear-gradient(90deg, #111, transparent)" }} />
            <Text mb={32} c="rgba(0,0,0,0.5)" style={{ fontSize: 15, lineHeight: 1.9, maxWidth: 480, letterSpacing: 0.2 }}>Modanın geçici akımları yerine stilin kalıcılığına odaklanıyoruz. Nitelikli dokuları modern bir disiplinle buluşturuyor; stilinizi bir duruş ifadesine dönüştürmeniz için zamansız çizgiler sunuyoruz.</Text>
            <motion.div whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 300 }}>
              <Box component="button" type="button" onClick={() => navigateToStore(navigate)} style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 32px", background: "transparent", border: "1px solid rgba(0,0,0,0.2)", color: "#111", cursor: "pointer", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit" }}>
                Koleksiyonu İncele <span>→</span>
              </Box>
            </motion.div>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await productsApi.getAll();
        setProducts(shuffleArray(data));

        const counts = aggregateCategoryCounts(data);
        setCategories(
          Array.from(counts.entries())
            .map(([name, product_count]) => ({
              name,
              image: `${baseImgUrl}/${categoryImages[name.toLowerCase()] || "deneme.jpg"}`,
              product_count,
            }))
            .filter((c) => c.product_count > 0),
        );
      } catch (err) {
        console.error("Kategoriler yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box style={{ overflowX: "hidden" }}>
      <Hero />
      <MarqueeTicker />
      <StatsSection />
      <CategoriesSection categories={categories} loading={loading} />
      {!loading && (
        <>
          <HomeProductStrip eyebrow="Alışveriş" title="Öne Çıkan Parçalar" description="Koleksiyonun en çok tercih edilen parçaları" products={pickProducts(products, HOME_STRIP_SIZE, 0)} tone="light" />
          <MyWardrobe />
          <HomeProductStrip eyebrow="Alışveriş" title="Yeni Sezon" products={pickProducts(products, HOME_STRIP_SIZE, HOME_STRIP_SIZE)} tone="muted" />
          <EditorialSection />
          <HomeProductStrip eyebrow="Alışveriş" title="Tarzını Yarat" products={pickProducts(products, HOME_STRIP_SIZE, HOME_STRIP_SIZE * 2)} tone="light" />
        </>
      )}
      <StorySection />
    </Box>
  );
};

export default Home;