import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { Search, Upload, Camera, Loader2, ArrowRight, DollarSign, Image as ImageIcon, ShoppingCart, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import type { AlternativesResponse, ProductAlternative } from "./types";

export default function App() {
  const [query, setQuery] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AlternativesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'exact' | 'recommendations'>('exact');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem.");
      return;
    }

    setMimeType(file.type);
    setQuery(""); // Clear text query if image is selected

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      
      // Extract base64 part
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !imageBase64) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/search-alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim() || undefined,
          imageBase64: imageBase64 || undefined,
          mimeType: mimeType || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar alternativas.");
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200 font-sans flex flex-col overflow-x-hidden relative">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.08),transparent_50%)] z-0"></div>

      <header className="h-20 bg-[#16191E] border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-full sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Desconto<span className="text-indigo-400">Finder</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Encontre produtos <span className="italic text-indigo-400">mais baratos</span>.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Digite o nome de um produto ou envie uma foto. Nossa IA analisará 
            o produto e sugerirá alternativas de melhor custo-benefício.
          </p>
        </div>

        <section className="bg-[#16191E] rounded-2xl border border-slate-800 p-6 sm:p-8 mb-8 group hover:border-indigo-500/50 transition-all shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!imagePreview ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: AirPods Pro, Tênis Nike Air Max..."
                  className="block w-full pl-11 pr-20 py-4 text-lg bg-[#0F1115] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-y-2 right-2 px-3 flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  title="Busca por imagem"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-[#0F1115] border border-slate-700 inline-block">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="h-48 w-auto object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 backdrop-blur-sm transition-colors"
                >
                  <span className="sr-only">Remover imagem</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
            />

            {!imagePreview && (
              <div className="flex items-center justify-center w-full">
                <div className="w-full relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full absolute"></div>
                  <span className="bg-[#16191E] px-4 text-sm font-bold text-slate-600 relative">OU</span>
                </div>
              </div>
            )}

            {!imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-700 bg-[#0F1115] rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <ImageIcon className="h-5 w-5" />
                Fazer upload de foto do produto
              </button>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={(!query.trim() && !imageBase64) || isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none focus:outline-none disabled:cursor-not-allowed uppercase"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Buscando alternativas...
                  </>
                ) : (
                  <>
                    Procurar Mais Baratos
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="p-4 bg-red-900/20 text-red-400 border border-red-900/50 rounded-xl mb-8 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#16191E] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-lg">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Produto Original</p>
                <h3 className="text-2xl font-bold text-white">{result.originalProduct.name}</h3>
              </div>
              {result.originalProduct.estimatedPrice && (
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Preço Estimado</p>
                  <p className="text-xl font-semibold text-slate-300">{result.originalProduct.estimatedPrice}</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex border-b border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('exact')}
                  className={`px-4 py-3 font-semibold text-sm uppercase tracking-wider transition-colors border-b-2 ${
                    activeTab === 'exact'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Mesmo Produto (Menor Preço)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('recommendations')}
                  className={`px-4 py-3 font-semibold text-sm uppercase tracking-wider transition-colors border-b-2 ${
                    activeTab === 'recommendations'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Recomendações
                </button>
              </div>

              {activeTab === 'exact' && result.exactMatches && result.exactMatches.length > 0 && (
                <motion.div 
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {result.exactMatches.map((match, index) => (
                    <motion.div 
                      key={index} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[#16191E] border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all flex flex-col h-full shadow-lg relative overflow-hidden"
                    >
                      <div className="mb-4">
                        <h4 className="text-sm text-slate-400 uppercase tracking-wider font-semibold leading-tight mb-2">{match.store}</h4>
                        <p className="text-3xl font-extrabold text-green-400 mb-1">{match.price}</p>
                        {match.savings && (
                          <div className="inline-flex items-center mt-1 mb-2 px-2 py-0.5 rounded text-[10px] bg-green-900/30 text-green-400 font-bold uppercase tracking-wide">
                            {match.savings}
                          </div>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm flex-grow mb-6">
                        Produto idêntico encontrado nesta loja por um preço mais acessível.
                      </p>
                      
                      <a
                        href={match.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-auto py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 group/btn"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Acessar Loja
                        <ExternalLink className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'exact' && (!result.exactMatches || result.exactMatches.length === 0) && (
                <div className="text-center py-10 text-slate-500">
                  Nenhum produto idêntico com preço menor encontrado. Tente ver as Recomendações!
                </div>
              )}

              {activeTab === 'recommendations' && (
                <motion.div 
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {result.alternatives.map((alt, index) => (
                    <motion.div 
                      key={index} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[#16191E] border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all flex flex-col h-full shadow-lg relative overflow-hidden"
                    >
                      <div className="mb-4">
                        <h4 className="text-sm text-slate-400 uppercase tracking-wider font-semibold leading-tight mb-2">{alt.name}</h4>
                        <p className="text-3xl font-extrabold text-green-400 mb-1">{alt.price}</p>
                        {alt.savings && (
                          <div className="inline-flex items-center mt-1 mb-2 px-2 py-0.5 rounded text-[10px] bg-green-900/30 text-green-400 font-bold uppercase tracking-wide">
                            {alt.savings}
                          </div>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm flex-grow mb-6">
                        {alt.reason}
                      </p>
                      
                      <a
                        href={alt.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-auto py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 group/btn"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Ver Alternativa
                        <ExternalLink className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
