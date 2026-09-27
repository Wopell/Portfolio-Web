import { motion } from 'motion/react';
import { Mail, Instagram, Send, MapPin, Briefcase, GraduationCap, Palette } from 'lucide-react';

function SkillBar({ label, level, subtitle, isFuture = false }: { label: string; level: number; subtitle: string; isFuture?: boolean }) {
  return (
    <div className={`space-y-2 ${isFuture ? 'opacity-25' : ''}`}>
      <div className="flex justify-between items-baseline">
        <p className="font-display font-black text-[12px] uppercase tracking-[0.1em]">{label}</p>
        <p className="font-serif italic text-[11px] opacity-40 lowercase">{subtitle}</p>
      </div>
      <div className="relative h-[2px] bg-black/5 w-full overflow-hidden">
        <motion.div
           initial={{ scaleX: 0 }}
           whileInView={{ scaleX: level / 100 }}
           viewport={{ once: true }}
           transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
           className="absolute inset-y-0 left-0 w-full bg-black origin-left"
        />
        {isFuture && <div className="absolute inset-0 border-t border-dashed border-black/20" />}
      </div>
    </div>
  );
}

export default function About() {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <section id="about" className="bg-white text-black min-h-screen relative">
      {/* Structural Grid Overlay (Subtle) */}
      <div className="absolute inset-0 pointer-events-none border-x border-black/5 max-w-[1600px] mx-auto" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-black/5 hidden md:block" />

      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-[1600px] mx-auto px-6 py-24 md:py-40 relative z-10"
      >
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 mb-32 border-b border-black pb-24">
          <motion.div variants={item} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold opacity-60">My name</span>
            </div>
            <h2 className="font-display font-black text-[12vw] md:text-[8vw] leading-[0.8] tracking-tighter uppercase">
              Tomy<br />Powell
            </h2>
            <div className="pt-4">
               <span className="font-mono text-[9px] opacity-40 uppercase tracking-[0.2em] block mb-2">artist name</span>
               <span className="text-luxury text-3xl opacity-90 group-hover:opacity-100 transition-opacity">Wopell</span>
            </div>
          </motion.div>

          <motion.div variants={item} className="flex flex-col justify-end space-y-12">
            <p className="font-sans text-xl md:text-3xl leading-[1.3] tracking-tight max-w-md font-light">
              Multimedia design student and <span className="text-luxury">Motion Graphics</span> designer based in Buenos Aires, Argentina. 
              Driven by beauty, physics, and curiosity.
            </p>
            
            <div className="grid grid-cols-2 gap-12 border-t border-black/20 pt-12">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold text-black opacity-80">Experience</span>
                <span className="font-display font-black text-3xl uppercase tracking-tighter">3+ Years</span>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold text-black opacity-80">Location</span>
                <span className="font-display font-black text-3xl uppercase tracking-tighter">Buenos Aires</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black/10 border-y border-black/10 mb-32">
          {/* Column 1: Studies */}
          <motion.div variants={item} className="bg-white p-8 md:p-12 space-y-6">
            <GraduationCap size={20} strokeWidth={1.5} />
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold opacity-60">Education</h3>
            <div className="space-y-4">
              <p className="font-display font-black text-xl uppercase tracking-tight">Multimedia Design</p>
              <p className="font-sans text-sm text-black/80 leading-relaxed italic">
                Currently focusing on implementing AI for Blender and video generation, 3D modeling, and advanced motion theory.
              </p>
            </div>
          </motion.div>

          {/* Column 2: Industry */}
          <motion.div variants={item} className="bg-white p-8 md:p-12 space-y-6 border-x border-black/10">
            <Briefcase size={20} strokeWidth={1.5} />
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold opacity-60">Experience</h3>
            <div className="space-y-4">
              <p className="font-display font-black text-xl uppercase tracking-tight">Motion Designer</p>
              <p className="font-sans text-sm text-black/80 leading-relaxed">
                Specializing in motion graphics, 3D assets, and high-impact visual storytelling for the industry.
              </p>
            </div>
          </motion.div>

          {/* Column 3: Contact */}
          <motion.div variants={item} className="bg-white p-8 md:p-12 space-y-6">
            <MapPin size={20} strokeWidth={1.5} />
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold opacity-60">Contact</h3>
            <div className="flex flex-col gap-4">
              <a href="mailto:tomy.wopell@gmail.com" className="group flex items-center gap-3 font-display font-black text-lg hover:translate-x-2 transition-transform">
                <Mail size={16} className="opacity-40 group-hover:opacity-100" />
                EMAIL.ME
              </a>
              <div className="flex gap-4 pt-4">
                <a href="https://instagram.com/wopell" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                  <Instagram size={18} />
                </a>
                <a href="https://t.me/wopell" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                  <Send size={18} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tools & Skills Section */}
        <motion.div variants={item} className="mb-40">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold opacity-60">Core Expertise</span>
              </div>
              <h2 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter">
                Technical Stack
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-12">
            {/* Mastered & Core */}
            <div className="space-y-10">
              <div>
                <h4 className="font-mono text-[11px] tracking-[0.2em] uppercase mb-8 flex items-center gap-4 font-bold opacity-60">
                  <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  Primary Execution
                </h4>
                <div className="grid grid-cols-1 gap-6">
                  <SkillBar label="After Effects" level={100} subtitle="Professional Mastery" />
                  <SkillBar label="Illustrator" level={100} subtitle="Professional Mastery" />
                  <SkillBar label="Photoshop" level={90} subtitle="Experienced" />
                  <SkillBar label="Premiere Pro" level={85} subtitle="Experienced" />
                  <SkillBar label="Blender" level={85} subtitle="Experienced" />
                  <SkillBar label="Substance Painter" level={80} subtitle="Experienced" />
                </div>
              </div>
            </div>

            {/* In Development & Future */}
            <div className="space-y-10">
              <div>
                <h4 className="font-mono text-[11px] tracking-[0.2em] uppercase mb-8 flex items-center gap-4 font-bold opacity-40">
                  <span className="w-1.5 h-1.5 border border-black/40 rounded-full" />
                  Neural Expansion
                </h4>
                <div className="grid grid-cols-1 gap-6">
                  <SkillBar label="Generative AI" level={65} subtitle="Researching" />
                  <SkillBar label="DaVinci Resolve" level={60} subtitle="Experienced" />
                  <SkillBar label="Web Design" level={55} subtitle="Studying" />
                  <SkillBar label="Unity" level={40} subtitle="Training Initiated" />
                  <SkillBar label="ComfyUI / AI Workflows" level={40} subtitle="Studying" />
                  <SkillBar label="Nuke" level={20} subtitle="Training Initiated" />
                </div>
              </div>

              <div className="pt-8 border-t border-black/5">
                <h4 className="font-mono text-[11px] tracking-[0.2em] uppercase mb-8 flex items-center gap-4 font-bold opacity-30">
                  Future Integration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SkillBar label="Unreal Engine 5" level={0} subtitle="Queued for Learning" isFuture />
                  <SkillBar label="Houdini" level={0} subtitle="Queued for Learning" isFuture />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Narrative Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <motion.div variants={item} className="md:col-span-7 space-y-12">
            <h3 className="font-display font-black text-5xl md:text-7xl leading-[0.9] tracking-tighter uppercase">
              Game addict, big fan of League of Legends, 2.5 style, Arcane and Fortiche Studios.
            </h3>
            
            <div className="flex flex-wrap gap-12">
              <div className="space-y-4">
                <p className="font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">Interests</p>
                <ul className="space-y-2 font-display font-bold text-lg uppercase">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-black" />
                    Hand Painting
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-black" />
                    Stylized 3D
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-black" />
                    Video Game Art
                  </li>
                </ul>
              </div>

              <div className="space-y-4 max-w-sm">
                <p className="font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">Aspiration</p>
                <p className="font-sans text-sm text-black/70 leading-relaxed uppercase font-bold tracking-tight">
                  I aspire to one day work at top-tier animation studios like <span className="border-b border-black">Fortiche Studios</span>, 
                  pushing the boundaries of stylized motion and traditional painting in digital environments.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="md:col-span-5 relative group">
            <div className="aspect-[4/5] bg-black/5 overflow-hidden border border-black/10 scale-95 group-hover:scale-100 transition-transform duration-700">
               {/* Decorative Graphic Element */}
               <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                  <span className="text-[30vw] font-black rotate-90">WOPELL</span>
               </div>
               {/* Small centered icon */}
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Palette size={48} strokeWidth={0.5} className="opacity-10 group-hover:scale-110 transition-transform duration-700" />
                  <span className="font-mono text-[8px] opacity-20 tracking-[0.5em] uppercase">Visual_Archetype</span>
               </div>
               
               {/* Corner accents */}
               <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-black/20" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-black/20" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Side Label */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:block origin-right rotate-90 mix-blend-difference">
        <span className="font-mono text-[10px] tracking-[1em] uppercase text-black/20 whitespace-nowrap">TOMY_POWELL // MULTIMEDIA_DESIGNER</span>
      </div>
    </section>
  );
}
