import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Text,
  Box,
  Title,
  Loader,
  Center,
  AspectRatio,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { BackgroundImage } from "@mantine/core";
import { motion, useScroll, useTransform } from "framer-motion";
import Hero from "../components/features/Hero";
import MyWardrobe from "../components/features/MyWardrobe";
import { productsApi } from "../api/client";
import { getImageUrl } from "../utils/imageUrl";

/* ─────────────────────────────────────────────
    1. ARKA PLAN İÇİN PARTICLE CANVAS (Background)
───────────────────────────────────────────── */
const BackgroundParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 140;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.3,
      op: Math.random() * 0.45 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    canvas.addEventListener("mousemove", onMove);

    let t = 0;
    const draw = () => {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      t += 0.016;

      for (let w = 0; w < 4; w++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.38 + w * 50);
        for (let x = 0; x <= canvas.width; x += 3) {
          const y =
            canvas.height * 0.38 +
            w * 50 +
            Math.sin(x * 0.007 + t * 0.38 + w * 1.1) * 24 +
            Math.sin(x * 0.013 + t * 0.22 - w * 0.8) * 14;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.035 - w * 0.006})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      const { x: mx, y: my } = mouseRef.current;
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
      g.addColorStop(0, "rgba(255,255,255,0.07)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx, my, 100, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.01;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const alpha = p.op * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();

        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 85) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(255,255,255,${0.055 * (1 - d / 85)})`;
            ctx.lineWidth = 0.35;
            ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
};

/* ─────────────────────────────────────────────
    2. DATA VERİLERİ (İstatistik ve Sözlük)
───────────────────────────────────────────── */
const statsData = [
  { num: "400+", label: "Benzersiz Parça" },
  { num: "25", label: "Yıllık Deneyim" },
  { num: "11", label: "Kategori" },
];

const tickerWords = [
  "Zamansız Tasarım",
  "Yüksek Kalite",
  "Özgün Stil",
  "Sürdürülebilir Moda",
  "Elegance Redefined",
  "Timeless Collection",
  "Minimal Luxury",
  "Statement Pieces",
];

/* ─────────────────────────────────────────────
    2A. YAVAŞ AKAN SONSUZ TICKER ŞERİDİ
───────────────────────────────────────────── */
const MarqueeTicker = () => {
  const tickerStr = [...tickerWords, ...tickerWords].join(" · ");

  return (
    <Box
      style={{
        background: "#fff",
        borderTop: "1px solid #e8e8e8",
        borderBottom: "1px solid #e8e8e8",
        overflow: "hidden",
        whiteSpace: "nowrap",
        padding: "10px 0",
      }}
    >
      <motion.div
        animate={{ x: [0, "-50%"] }}
        transition={{ duration: 45, ease: "linear", repeat: Infinity }}
        style={{ display: "inline-block" }}
      >
        <Text
          component="span"
          style={{
            fontSize: 10,
            letterSpacing: "4px",
            textTransform: "uppercase",
            fontWeight: 500,
            color: "#111",
          }}
        >
          {tickerStr} &nbsp;&nbsp;&nbsp; {tickerStr}
        </Text>
      </motion.div>
    </Box>
  );
};

/* ─────────────────────────────────────────────
    2B. İNTERAKTİF ARKA PLANLI İSTATİSTİK GRİDİ
───────────────────────────────────────────── */
const StatsSection = () => {
  const [counts, setCounts] = useState<any[]>(statsData.map(() => 0));
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          statsData.forEach((s, i) => {
            const raw = parseFloat(s.num.replace(/[^0-9.]/g, ""));
            const suffix = s.num.replace(/[0-9.]/g, "");
            let cur = 0;
            const steps = 55;
            const step = raw / steps;
            const id = setInterval(() => {
              cur = Math.min(cur + step, raw);
              setCounts((prev) => {
                const next = [...prev];
                next[i] = cur >= raw ? s.num : Math.round(cur) + suffix;
                return next;
              });
              if (cur >= raw) clearInterval(id);
            }, 22);
          });
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      style={{
        position: "relative",
        background: "#0a0a0a",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
      py={60}
    >
      <BackgroundParticleCanvas />

      <Container size="xl" style={{ position: "relative", zIndex: 2 }}>
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "rgba(255,255,255,0.07)",
          }}
        >
          {statsData.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              style={{
                background: "#0a0a0a",
                padding: "40px 0",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: 200,
                  color: "#fff",
                  letterSpacing: "2px",
                  lineHeight: 1,
                  fontFamily: "'Georgia', serif",
                  marginBottom: 10,
                }}
              >
                {counts[i] || s.num}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {s.label}
              </Text>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

/* ─────────────────────────────────────────────
    3. EDITORIAL FEATURED LOOK (Asimetrik Grid)
───────────────────────────────────────────── */
const EditorialSection = () => {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yLeft = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yRight = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  const editorialCards = [
    {
      tag: "Öne Çıkan",
      title: "Sezonun\nSesli Parçası",
      body: "Koleksiyonumuzdan bu sezon en çok konuşulan tasarım. Sadelik içinde güç.",
      bg: "#111",
      color: "#fff",
      accent: "rgba(255,255,255,0.08)",
      category: "Elbiseler",
    },
    {
      tag: "Editörün Seçimi",
      title: "Minimal\nAma Güçlü",
      body: "Her detayın hesaplanmış olduğu, sezonun vazgeçilmezi.",
      bg: "#f5f4f0",
      color: "#111",
      accent: "rgba(0,0,0,0.04)",
      category: "Ceketler & Kabanlar",
    },
  ];

  return (
    <Box ref={ref} style={{ background: "white", overflow: "hidden" }}>
      <Container size="xl" py={100}>
        <Box mb={60} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <Text
              style={{
                fontSize: 11,
                letterSpacing: "5px",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.35)",
                marginBottom: 10,
              }}
            >
              Editörün Seçimleri
            </Text>
            <Title
              order={2}
              style={{
                fontSize: "clamp(36px,5vw,56px)",
                fontWeight: 300,
                letterSpacing: "4px",
                textTransform: "uppercase",
                lineHeight: 1.05,
                fontFamily: "'Georgia', serif",
              }}
            >
              Öne Çıkan<br />Kombiner
            </Title>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            style={{ textAlign: "right", maxWidth: 260 }}
          >
            <Text style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", lineHeight: 1.8, letterSpacing: "0.3px" }}>
              Her parça bir ifade. Her kombin bir duruş. Zamanı durduran seçimler burada.
            </Text>
          </motion.div>
        </Box>

        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gridTemplateRows: "auto auto",
            gap: "2px",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <motion.div style={{ y: yLeft, gridRow: "1 / 3" }}>
            <Box
              onClick={() => navigate(`/store?category=${encodeURIComponent(editorialCards[0].category)}`)}
              style={{
                background: editorialCards[0].bg,
                height: "100%",
                minHeight: 520,
                padding: "52px 48px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box style={{ position: "absolute", top: 24, left: 24, width: 32, height: 32, borderTop: "1px solid rgba(255,255,255,0.25)", borderLeft: "1px solid rgba(255,255,255,0.25)" }} />
              <Box style={{ position: "absolute", bottom: 24, right: 24, width: 32, height: 32, borderBottom: "1px solid rgba(255,255,255,0.25)", borderRight: "1px solid rgba(255,255,255,0.25)" }} />

              <motion.div
                animate={{ opacity: [0.03, 0.07, 0.03] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.04) 40px)",
                  pointerEvents: "none",
                }}
              />

              <Box>
                <Text style={{ fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
                  {editorialCards[0].tag}
                </Text>
                <Title
                  order={3}
                  style={{
                    fontSize: 42, fontWeight: 300, color: "#fff",
                    letterSpacing: "3px", textTransform: "uppercase",
                    lineHeight: 1.1, fontFamily: "'Georgia', serif",
                    whiteSpace: "pre-line", marginBottom: 20,
                  }}
                >
                  {editorialCards[0].title}
                </Title>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 320, marginBottom: 32 }}>
                  {editorialCards[0].body}
                </Text>
                <motion.div whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Text
                    style={{
                      fontSize: 10, letterSpacing: "4px", textTransform: "uppercase",
                      color: "#fff", display: "inline-flex", alignItems: "center", gap: 12,
                      borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 4,
                    }}
                  >
                    Koleksiyonu Gör <span>→</span>
                  </Text>
                </motion.div>
              </Box>
            </Box>
          </motion.div>

          <motion.div style={{ y: yRight }}>
            <Box
              onClick={() => navigate(`/store?category=${encodeURIComponent(editorialCards[1].category)}`)}
              style={{
                background: editorialCards[1].bg,
                minHeight: 260,
                padding: "40px 36px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                borderBottom: "2px solid white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box style={{ position: "absolute", top: 20, left: 20, width: 24, height: 24, borderTop: "1px solid rgba(0,0,0,0.15)", borderLeft: "1px solid rgba(0,0,0,0.15)" }} />
              <Text style={{ fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: 12 }}>
                {editorialCards[1].tag}
              </Text>
              <Title order={3} style={{ fontSize: 28, fontWeight: 300, letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1.1, fontFamily: "'Georgia', serif", whiteSpace: "pre-line", marginBottom: 16 }}>
                {editorialCards[1].title}
              </Title>
              <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", lineHeight: 1.7 }}>{editorialCards[1].body}</Text>
            </Box>
          </motion.div>

          <motion.div
            style={{ y: yRight }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box
              style={{
                background: "#111",
                minHeight: 260,
                padding: "40px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Text
                style={{
                  position: "absolute", bottom: -20, right: 16,
                  fontSize: 140, fontWeight: 200, color: "rgba(255,255,255,0.04)",
                  fontFamily: "'Georgia', serif", lineHeight: 1, pointerEvents: "none",
                  userSelect: "none", letterSpacing: "-4px",
                }}
              >
                26
              </Text>
              <Text style={{ fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                2026 Koleksiyonu
              </Text>
              <Box>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.9, marginBottom: 20 }}>
                  Yeni sezonda stili yeniden tanımlayan parçalar seçilmeyi bekliyor.
                </Text>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { navigate("/store"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  style={{
                    display: "inline-block",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "12px 28px",
                    cursor: "pointer",
                    fontSize: 10,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: "#fff",
                  }}
                >
                  Tümünü İncele
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

/* ─────────────────────────────────────────────
    ANA SAYFA AKIŞI
───────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });

  const categoryDescriptions: Record<string, string> = {
    Elbiseler: "Satın aldığınız her parça otomatik olarak koleksiyonunuza eklenir. Akıllı",
    "Ceketler & Kabanlar": "Her detayda modern bir duruş ve estetik çizgiler.",
    Ayakkabılar: "Stilinizi tamamlayan ve adımlarınıza eşlik eden konfor.",
    "Çantalar & Aksesuarlar": "Zarif dokunuşlarla şıklığı en üst seviyeye taşıyın.",
    "Bluzlar & Gömlekler": "Klasik hatların modern asimetriyle mükemmel uyumu.",
    "Kazaklar & Hırkalar": "Sıcak, rafine dokular ve zamansız kış şıklığı.",
    Pantolonlar: "Gün boyu konfor ve kusursuz silüetler için tasarlandı.",
  };

  const categoryImages: Record<string, string> = {
    "ayakkabı": "http://localhost:5000/images/shoes.jpg",
    "ayakkabılar": "http://localhost:5000/images/shoes.jpg",
    "gömlek": "http://localhost:5000/images/shirt.jpg",
    "bluzlar & gömlekler": "http://localhost:5000/images/shirt.jpg",
    "bluz": "http://localhost:5000/images/blouse.jpg",
    "elbise": "http://localhost:5000/images/dress.jpg",
    "elbiseler": "http://localhost:5000/images/dress.jpg",
    "kaban ve ceket": "http://localhost:5000/images/jacket.jpg",
    "ceketler & kabanlar": "http://localhost:5000/images/jacket.jpg",
    "ceket": "http://localhost:5000/images/jacket.jpg",
    "kaban": "http://localhost:5000/images/jacket.jpg",
    "jean": "http://localhost:5000/images/jeans.jpg",
    "pantolon": "http://localhost:5000/images/pants.jpg",
    "pantolonlar": "http://localhost:5000/images/pants.jpg",
    "kazak": "http://localhost:5000/images/jumper.jpg",
    "kazaklar": "http://localhost:5000/images/jumper.jpg",
    "hırka": "http://localhost:5000/images/jumper.jpg",
    "hırkalar": "http://localhost:5000/images/jumper.jpg",
    "triko": "http://localhost:5000/images/jumper.jpg",
    "trikolar": "http://localhost:5000/images/jumper.jpg",
    "kazak ve hırka": "http://localhost:5000/images/jumper.jpg",
    "kazaklar ve hırkalar": "http://localhost:5000/images/jumper.jpg",
    "kazaklar & hırkalar": "http://localhost:5000/images/jumper.jpg",
    "top": "http://localhost:5000/images/blouse.jpg",
    "etek": "http://localhost:5000/images/skirt.jpg",
    "etekler": "http://localhost:5000/images/skirt.jpg",
    "çanta": "http://localhost:5000/images/bag.jpg",
    "çantalar & aksesuarlar": "http://localhost:5000/images/bag.jpg",
    "aksesuar": "http://localhost:5000/images/accesories.jpg",
    "aksesuarlar": "http://localhost:5000/images/accesories.jpg",
  };

  // Kartların dikeydeki asimetrik dalgalanması (Arka plan kıvrım uyumu için keskinleştirildi)
  const yOffsets = [0, 60, -30, 40, -50, 20, -10];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsApi.getAll();
        const categoriesMap = new Map();
        response.data.forEach((product: any) => {
          if (product.category) {
            const current = categoriesMap.get(product.category) || { count: 0, image: "" };
            if (!current.image && product.images?.length > 0) {
              current.image = getImageUrl(product.images[0]);
            }
            categoriesMap.set(product.category, { count: current.count + 1, image: current.image });
          }
        });
        const categoriesArray = Array.from(categoriesMap.entries())
          .map(([name, data]) => ({
            name,
            image: categoryImages[name.toLowerCase()] || data.image || "http://localhost:5000/images/deneme.jpg",
            description: categoryDescriptions[name] || "Satın aldığınız her parça otomatik olarak eklenir.",
            product_count: data.count,
          }))
          .filter((cat) => cat.product_count > 0);
        setCategories(categoriesArray);
      } catch (error) {
        console.error("Kategoriler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Kaydırma sınırlarını hesaplama (Framer Motion Drag Constraints)
  useEffect(() => {
    if (carouselRef.current) {
      setConstraints({
        left: -carouselRef.current.scrollWidth + carouselRef.current.offsetWidth,
        right: 0,
      });
    }
  }, [categories]);

  return (
    <Box style={{ overflowX: "hidden" }}>
      {/* 1. Hero Giriş Ekranı */}
      <Hero />

      {/* 2. Yavaş Akan Sonsuz Marquee Ticker */}
      <MarqueeTicker />

      {/* 3. İnteraktif Arka Planlı İstatistik Paneli */}
      <StatsSection />

      {/* 4. Kategoriler */}
      <Box
        style={{
          position: "relative",
          backgroundImage: "url('http://localhost:5000/images/categories_background.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "#fff",
        }}
      >
        <Container size="xl" pt={80} pb={80} id="categories" style={{ position: "relative", zIndex: 1 }}>
          {loading ? (
            <Center py={40}>
              <Loader color="black" />
            </Center>
          ) : (
            <Carousel
              slideSize={{ base: "80%", sm: "40%", md: "25%", lg: "20%" }}
              slideGap={{ base: "md", md: "lg" }}
              withControls
              align="start"
            >
              {categories.map((category, index) => (
                <Carousel.Slide key={category.name}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    {/* Altta Olan Kart (Tek İndeksler) -> İsim ÜSTTE yazılır */}
                    {index % 2 !== 0 && (
                      <Box h={60} display="flex" style={{ alignItems: "center", justifyContent: "center", paddingBottom: "10px" }}>
                        <Title
                          order={4}
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 500,
                            fontSize: "20px",
                            letterSpacing: "2px",
                            color: "#111",
                          }}
                        >
                          {category.name.toLocaleUpperCase("tr-TR")}
                        </Title>
                      </Box>
                    )}

                    <AspectRatio
                      ratio={1 / 1}
                      onClick={() => {
                        navigate(`/store?category=${encodeURIComponent(category.name)}`);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      pos="relative"
                      style={{
                        cursor: "pointer",
                        overflow: "hidden",
                        borderRadius: "12px",
                        border: "6px solid white",
                        boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
                        width: "100%",
                      }}
                    >
                      <BackgroundImage
                        src={category.image}
                        className="hover-scale"
                        style={{ height: "100%", width: "100%" }} // Karartmayı kaldırdık, çünkü isim artık dışında
                      />
                    </AspectRatio>

                    {/* Üstte Olan Kart (Çift İndeksler) -> İsim ALTTA yazılır */}
                    {index % 2 === 0 && (
                      <Box h={60} display="flex" style={{ alignItems: "center", justifyContent: "center", paddingTop: "10px" }}>
                        <Title
                          order={4}
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 500,
                            fontSize: "20px",
                            letterSpacing: "2px",
                            color: "#111",
                          }}
                        >
                          {category.name.toLocaleUpperCase("tr-TR")}
                        </Title>
                      </Box>
                    )}
                  </motion.div>
                </Carousel.Slide>
              ))}
            </Carousel>
          )}
        </Container>
      </Box>

      {/* 5. Asimetrik Editöryal Seçimler */}
      <EditorialSection />

      {/* 6. Yapay Zeka Gardırobu */}
      <MyWardrobe />

      {/* 7. Kendini Keşfet Hikaye Bölümü */}
      <Box bg="#f8f9fa" pt={20} pb={{ base: 60, md: 100 }}>
        <Container size="xl">
          <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
            <Box pos="relative" w={500} maw="100%" style={{ overflow: "hidden", aspectRatio: "1.5/1", flexShrink: 0 }}>
              <video
                autoPlay loop muted playsInline
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="http://localhost:5000/videos/267244.mp4" type="video/mp4" />
              </video>
            </Box>

            <Box px={{ base: "md", md: "lg" }} maw={600} style={{ textAlign: "left", flex: "0 1 auto" }}>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Title order={2} mb="lg" style={{ fontSize: "clamp(28px, 5vw, 42px)", letterSpacing: "2px" }}>
                  KENDİNİ KEŞFET
                </Title>
                <Text size="lg" mb="xl" fw={300} lh={1.8} style={{ letterSpacing: "0.5px" }}>
                  Modanın geçici akımları yerine, stilin kalıcılığına odaklanıyoruz. Koleksiyonlarımız; nitelikli dokuları modern bir disiplinle bir araya getirerek kişisel tarzınıza eşlik ediyor. Stil, sadece bir tercih değil, bir duruş ifadesidir. Kendinizi yansıtan zamansız çizgileri keşfetmeniz için tasarlıyoruz.
                </Text>
              </motion.div>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;