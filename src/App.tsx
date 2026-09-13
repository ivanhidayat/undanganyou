import { useEffect, useRef, useState } from 'react'
import './App.css'
import './story-reel.css'
import { supabase } from './lib/supabase'
import './wish-list.css'
import './map.css'
import './music-island.css'
import './glass-ui.css'

type Tab = 'home' | 'story' | 'event' | 'rsvp'

const countdownTarget = new Date('2026-10-07T07:00:00+07:00').getTime()
const whatsappNumber = '6281256761105'
const familyLocations = [
  { id: 'groom', title: 'Kediaman Mempelai Pria', url: 'https://maps.app.goo.gl/fHb1QeF3GpY4B6pu7?g_st=ic', embedUrl: 'https://www.google.com/maps?q=H3CV%2BW9X%2BLAVINA%2BSHOP%2C%20Unnamed%20Road%20Sawangan%2C%20Sawangan%2C%20Kec.%20Ajibarang%2C%20Kabupaten%20Banyumas%2C%20Jawa%20Tengah%2053163&output=embed' },
  { id: 'bride', title: 'Kediaman Mempelai Wanita', url: 'https://maps.app.goo.gl/2WVSxij4MiScxanKA?g_st=iw', embedUrl: 'https://www.google.com/maps?q=H3HQ%2BRF6%2BToko%20Berkah%20Lancar%2C%20Tajur%2C%20Pancurendang%2C%20Kec.%20Ajibarang%2C%20Kabupaten%20Banyumas%2C%20Jawa%20Tengah%2053163&output=embed' },
]
const giftAccounts = [
  { id: 'groom', role: 'Mempelai Pria', bank: 'BNI', number: '1972242539', holder: 'Fani Setiawan', logo: '/bank-bca.png' },
  { id: 'bride', role: 'Mempelai Wanita', bank: 'BNI', number: '1494829695', holder: 'Ella Afiani', logo: '/bank-bca.png' },
]
const episodes = [
  { id: 'ep01', tag: 'EP 01', title: '01 Pendekatan', image: '/story/episode-01.jpg', text: 'Kata nya cinta tumbuh dengan kebersamaan, seiring berjalannya waktu, kami semakin dekat dan memilih berkomitmen untuk bersama.' },
  { id: 'ep02', tag: 'EP 02', title: '02 Janji Setia', image: '/story/episode-02.jpg', text: 'Di titik ini, tahun 2025 momen lamaran menjadi bukti nyata dari kesungguhan hati sebuah pernyataan bahwa kami siap melangkah lebih jauh. Kami memilih untuk saling menjaga, memulai dari detik ini hingga selamanya.' },
  { id: 'ep03', tag: 'EP 03', title: '03 Awal Selamanya', image: '/story/episode-03.jpg', text: 'Atas kehendak Allah SWT menuntun keyakinan kami untuk mengikrarkan janji suci pernikahan kami pada 07 Oktober 2026.' },
]
const photos = [
  { src: '/gallery/photo-01.jpg', label: 'The beginning', alt: 'Placeholder foto The beginning' },
  { src: '/gallery/photo-02.jpg', label: 'Our promise', alt: 'Placeholder foto Our promise' },
  { src: '/gallery/photo-03.jpg', label: 'Forever', alt: 'Placeholder foto Forever' },
  { src: '/gallery/photo-04.jpg', label: 'The day', alt: 'Placeholder foto The day' },
]
const loveEmojis = ['💍', '💖', '🥰', '💐', '😂']

function App() {
  const [opened, setOpened] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [sent, setSent] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [galleryUnlocked, setGalleryUnlocked] = useState(false)
  const [flowerLeaving, setFlowerLeaving] = useState(false)
  const [flowerProgress, setFlowerProgress] = useState(0)
  const [verseVisible, setVerseVisible] = useState(false)
  const [activeGift, setActiveGift] = useState<typeof giftAccounts[number] | null>(null)
  const [selectedFamilyLocation, setSelectedFamilyLocation] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [wishes, setWishes] = useState<{ id: number; name: string; attendance: string; message: string; created_at: string }[]>([])
  const [storyStage, setStoryStage] = useState(0)
  const [openEpisode, setOpenEpisode] = useState<string | null>(null)
  const [emojiPop, setEmojiPop] = useState<string | null>(null)
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; left: number; top: number; rotate: number }[]>([])
  const galleryTrackRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const episodeRefs = useRef<Record<string, HTMLElement | null>>({})
  const pathGuestName = decodeURIComponent(window.location.pathname.split('/').filter(Boolean)[0] || '')
  const queryGuestName = new URLSearchParams(window.location.search).get('to') || ''
  const guestName = queryGuestName || pathGuestName || 'Tamu Undangan'

  useEffect(() => {
    const verse = document.querySelector('.verse-card')
    if (!verse || verseVisible) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVerseVisible(true)
        observer.disconnect()
      }
    }, { root: document.querySelector('.app-shell'), threshold: 0.2 })
    observer.observe(verse)
    return () => observer.disconnect()
  }, [verseVisible, tab, galleryUnlocked])

  useEffect(() => {
    const track = galleryTrackRef.current
    if (!track) return
    const onScroll = () => {
      const cards = Array.from(track.children) as HTMLElement[]
      const center = track.scrollLeft + track.clientWidth / 2
      const nearest = cards.reduce((best, card, index) => {
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
        return distance < best.distance ? { index, distance } : best
      }, { index: activePhoto, distance: Number.POSITIVE_INFINITY })
      if (nearest.index !== activePhoto) setActivePhoto(nearest.index)
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [activePhoto])

  useEffect(() => {
    const client = supabase
    if (!client) return
    const loadWishes = async () => {
      const { data } = await client.from('wishes').select('id,name,attendance,message,created_at').order('created_at', { ascending: false })
      if (data) setWishes(data)
    }
    loadWishes()
    const channel = client.channel('wishes-live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (payload) => {
      setWishes((current) => [payload.new as typeof wishes[number], ...current])
    }).subscribe()
    return () => { client.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const update = () => {
      const distance = Math.max(0, countdownTarget - Date.now())
      setTimeLeft({
        days: Math.floor(distance / 86400000),
        hours: Math.floor(distance / 3600000) % 24,
        minutes: Math.floor(distance / 60000) % 60,
        seconds: Math.floor(distance / 1000) % 60,
      })
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const playStory = () => {
    if (storyStage > 0) return
    const steps = [[1, 60], [2, 900], [3, 2200]] as const
    steps.forEach(([stage, delay]) => window.setTimeout(() => setStoryStage(stage), delay))
  }

  const toggleEpisode = (id: string) => {
    const next = openEpisode === id ? null : id
    setOpenEpisode(next)
    if (!next) return
    // Wait for the row to expand before centring it, so the scroll lands precisely.
    window.setTimeout(() => {
      const item = episodeRefs.current[id]
      const shell = document.querySelector('.app-shell')
      if (!item || !shell) return
      const offset = item.getBoundingClientRect().top - shell.getBoundingClientRect().top
      shell.scrollTo({ top: shell.scrollTop + offset - 120, behavior: 'smooth' })
    }, 380)
  }

  const submitRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') || '').trim()
    const attendance = String(data.get('attendance') || '')
    const message = String(data.get('message') || '').trim()
    if (supabase) {
      const { error } = await supabase.from('wishes').insert({ name, attendance, message: message || 'Tanpa pesan' })
      if (error) { window.alert('Ucapan gagal disimpan. Coba lagi.'); return }
    }
    const text = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  const addToCalendar = () => {
    const calendarUrl = new URL('https://calendar.google.com/calendar/render')
    calendarUrl.searchParams.set('action', 'TEMPLATE')
    calendarUrl.searchParams.set('text', 'Akad & Resepsi Fani dan Ella')
    calendarUrl.searchParams.set('dates', '20261007T000000Z/20261007T100000Z')
    calendarUrl.searchParams.set('details', 'Pernikahan Fani Setiawan dan Ella Afiani')
    calendarUrl.searchParams.set('location', 'Hutan Pinus Sawangan, -7.4416575, 109.0911668')
    window.open(calendarUrl.toString(), '_blank', 'noopener,noreferrer')
  }

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.volume = 0.8
      audio.load()
      audio.play().then(() => setMusicPlaying(true)).catch((error) => {
        console.error('Musik gagal diputar:', error)
        window.alert('Musik belum bisa diputar. Coba klik tombol musik sekali lagi.')
      })
    } else { audio.pause(); setMusicPlaying(false) }
  }

  const selectTab = (nextTab: Tab) => {
    setTab(nextTab)
    document.querySelector('.app-shell')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectPhoto = (index: number) => {
    const track = galleryTrackRef.current
    const card = track?.children[index] as HTMLElement | undefined
    if (!track || !card) return
    setActivePhoto(index)
    const start = track.scrollLeft
    const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2
    const distance = target - start
    const duration = 1050
    const startedAt = performance.now()
    const ease = (value: number) => value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      track.scrollLeft = start + distance * ease(progress)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }

  if (!opened) {
    return (
      <main className="opening-screen">
        <div className="opening-backdrop" />
        <div className="opening-content">
          <span className="eyebrow">A NETFLIX WEDDING SPECIAL</span>
          <div className="brand"><i /> WEDDINGFLIX</div>
          <p className="opening-kicker">Kepada Yth.</p>
          <h2 className="guest-name">{guestName}</h2>
          <p className="opening-kicker story-kicker">A new story is about to begin</p>
          <h1>Fani <span>&</span> Ella</h1>
          <p className="opening-date">07.10.2026 · Ajibarang</p>
          <button className="play-button" onClick={() => { setOpened(true); window.setTimeout(() => { const audio = audioRef.current; if (audio) { audio.volume = .8; audio.play().then(() => setMusicPlaying(true)).catch(() => {}) } }, 120) }}><span>▶</span> Buka Undangan</button>
          <p className="swipe-note">Undangan pernikahan digital</p>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><i /> WEDDINGFLIX</div>
        <button className={`sound-button ${musicPlaying ? 'is-playing' : ''}`} onClick={toggleMusic} aria-label={musicPlaying ? 'Jeda musik' : 'Putar musik'}><span className="music-island"><i /><b>{musicPlaying ? 'Bermuara' : 'Musik undangan'}</b><small>{musicPlaying ? 'Fani & Ella · sedang diputar' : 'Ketuk untuk memutar'}</small></span><span className="music-record" aria-hidden="true"><span /></span></button>
      </header>

      {tab === 'home' && <>
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">WEDDINGFLIX ORIGINAL</span>
            <h1>Fani <small>and</small> Ella</h1>
            <p className="meta"><b>2026</b><b className="rating">SU</b><span>Rabu</span><span>07 Oktober 2026</span></p>
            <p className="description">Dua hati, satu janji, dan selamanya untuk dijalani bersama.</p>
            <div className="hero-actions"><button className="primary-button" onClick={() => selectTab('event')}>▶ Lihat Acara</button><button className="icon-button" onClick={() => selectTab('story')}>＋<small>Detail</small></button></div>
          </div>
        </section>
        <section className="content-section"><div className="section-heading"><h2>Melanjutkan cerita</h2><span>100%</span></div><div className="continue-card"><div className="mini-poster" /><div><strong>Episode 01: Hari Pertama</strong><p>“Our forever starts here”</p><div className="progress"><i /></div></div><b className="play-small">▶</b></div></section>
        <section className="content-section"><h2>Profile Pengantin</h2><div className="profile-grid"><div><div className="avatar fani" /><b>Fani Setiawan, S.Pd</b><span>Putra Bapak Turyanto dan Ibu Naisah</span></div><div><div className="avatar ella" /><b>Ella Afiani, S.M</b><span>Putri Bapak Dirwan dan Ibu Sukarni</span></div></div></section>
      </>}

      {tab === 'story' && <section className={`page-content gallery-page ${galleryUnlocked ? 'is-unlocked' : ''}`}>{!galleryUnlocked && <div className={`flower-gate ${flowerLeaving ? 'leaving' : ''}`}><span className="eyebrow">A LITTLE SURPRISE</span><h1>Geser bunganya</h1><p className="lead">Buka halaman kenangan kami dengan mengangkat bunga ke kanan.</p><div className="flower-stage"><div className="flower-glow" /><div className="flower-rail"><div className="flower-fill" style={{ width: `${flowerProgress}%` }} /></div><div className="flower-handle" style={{ transform: `translateX(${flowerProgress * 2.1}px) scale(${0.88 + flowerProgress / 833})` }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const startX = event.clientX; const startProgress = flowerProgress; const move = (moveEvent: PointerEvent) => { const nextProgress = Math.min(100, Math.max(0, startProgress + ((moveEvent.clientX - startX) / 230) * 100)); setFlowerProgress(nextProgress); if (nextProgress >= 92) { setFlowerProgress(100); setFlowerLeaving(true); window.setTimeout(() => setGalleryUnlocked(true), 650) } }; const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up) }}><img src="/flower-bouquet.png.png" alt="Buket bunga" /></div></div><p className="glass-hint">Geser bunga ke kanan untuk membuka galeri <b>→</b></p></div>}<div className="gallery-reveal"><span className="eyebrow">OUR MEMORIES</span><h1>Gallery of <em>Love</em></h1><p className="lead">Potongan kecil dari perjalanan Fani dan Ella menuju hari istimewa.</p><div className="gallery-stage" style={{ backgroundImage: `url(${photos[activePhoto].src})` }}><div className="gallery-track" ref={galleryTrackRef}>{photos.map((photo, index) => <button className={`gallery-card ${index === activePhoto ? 'selected' : ''}`} key={photo.src} onClick={() => selectPhoto(index)}><img src={photo.src} alt={photo.alt} /><span>{photo.label}</span></button>)}</div><button className="gallery-arrow previous" onClick={() => selectPhoto((activePhoto - 1 + photos.length) % photos.length)} aria-label="Foto sebelumnya">‹</button><button className="gallery-arrow next" onClick={() => selectPhoto((activePhoto + 1) % photos.length)} aria-label="Foto berikutnya">›</button><div className="gallery-dots">{photos.map((photo, index) => <button key={photo.label} className={index === activePhoto ? 'active' : ''} onClick={() => selectPhoto(index)} aria-label={`Buka ${photo.label}`} />)}</div></div><div className="quote">“Every picture tells our favorite story.”</div><section className={`verse-card ${verseVisible ? 'verse-visible' : ''}`} onAnimationStart={() => setVerseVisible(true)}><span className="eyebrow">A VERSE FOR OUR JOURNEY</span><h2>Ar-Rum · 21</h2><p className="arabic" dir="rtl">وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِى ذَٰلِكَ لَءَايَٰتٍ لِّقَوْمٍ يَتَفَكَّرُونَ</p><p className="latin">Wa min āyātihī an khalaqa lakum min anfusikum azwājal litaskunū ilaihā wa ja'ala bainakum mawaddataw wa rahmah, inna fī zālika la'āyātil liqaumiy yatafakkarūn.</p><p className="translation">“Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.”</p></section>
        <section className={`story-reel stage-${storyStage}`}>
          <button className="reel-play" onClick={playStory}><span>▶</span> Play</button>
          <button className="reel-download">↓ Download</button>
          <div className="reel-screen">
            <button className="reel-title" onClick={playStory}>Awal Kisah</button>
            <p className="reel-intro">Tidak ada yang kebetulan di dunia ini. Semua sudah tersusun sangat rapi, oleh Allah SWT. Kita tidak bisa memilih kepada siapa kita akan berjodoh. Di antara milyaran ketidakmungkinan, semesta memilih untuk mempertemukan kami dalam suatu waktu yang tak terduga. Kami bertemu pertama kalinya pada tahun 2019.</p>
            <div className="reel-tabs">{episodes.map((episode, index) => <button key={episode.id} className={openEpisode === episode.id ? 'active' : ''} style={{ animationDelay: `${index * 220}ms` }} onClick={() => toggleEpisode(episode.id)}>{episode.tag}</button>)}</div>
            <div className="reel-list">{episodes.map((episode) => <article key={episode.id} ref={(node) => { episodeRefs.current[episode.id] = node }} className={`reel-item ${openEpisode === episode.id ? 'open' : ''}`}><div className="reel-inner" key={openEpisode === episode.id ? `${episode.id}-on` : `${episode.id}-off`}><div className="reel-frame"><img src={episode.image} alt={`Placeholder ${episode.title}`} /></div><div className="reel-copy"><h3>{episode.title}</h3><p>{episode.text}</p></div></div></article>)}</div>
          </div>
        </section></div></section>}
      {tab === 'event' && <section className="page-content"><span className="eyebrow">COMING SOON</span><h1>Save the <em>Date</em></h1><div className="countdown">{Object.entries(timeLeft).map(([label, value]) => <div key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}</div><div className="event-card"><span>EPISODE 01 · THE CEREMONY</span><h2>Akad & Resepsi</h2><p>Rabu, 07 Oktober 2026<br />07.00 WIB – selesai<br />Hutan Pinus Sawangan</p><button className="primary-button" type="button" onClick={addToCalendar}>＋ Tambah ke Kalender</button></div><div className="family-locations"><span className="eyebrow">ALAMAT KELUARGA</span><h2>Kediaman Mempelai</h2>{familyLocations.map((location) => <div className="family-location-wrap" key={location.id}><button className={`family-location ${selectedFamilyLocation === location.id ? 'selected' : ''}`} type="button" onClick={() => setSelectedFamilyLocation(selectedFamilyLocation === location.id ? null : location.id)}><span>{location.title}</span><b>{selectedFamilyLocation === location.id ? '⌃' : '⌄'}</b></button>{selectedFamilyLocation === location.id && <div className="family-map-card"><div className="family-map-preview"><iframe title={`Peta ${location.title}`} src={location.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div><a className="primary-button family-map-button" href={location.url} target="_blank" rel="noreferrer">↗ Buka Alamat di Google Maps</a></div>}</div>)}</div></section>}
      {tab === 'rsvp' && <section className="page-content"><span className="eyebrow">BE PART OF OUR STORY</span><h1>Will you <em>join us?</em></h1>{sent ? <div className="success-box"><span>✓</span><h2>Terima kasih!</h2><p>Kehadiranmu sudah kami catat.</p></div> : <form onSubmit={submitRsvp}><label>Nama lengkap<input name="name" required placeholder="Tulis nama kamu" /></label><label>Konfirmasi kehadiran<select name="attendance" required defaultValue=""><option value="" disabled>Pilih jawaban</option><option>Ya, saya akan hadir</option><option>Maaf, saya belum bisa hadir</option></select></label><label>Pesan untuk kami<textarea name="message" placeholder="Tulis ucapan terbaikmu..." /><span className="emoji-picker-label">Pilih emoticon</span><div className="emoji-picker">{loveEmojis.map((emoji) => <button className={`emoji-button ${emojiPop === emoji ? 'is-popping' : ''}`} type="button" key={emoji} aria-label={`Tambah ${emoji}`} onClick={(event) => { const textarea = event.currentTarget.closest('form')?.querySelector('textarea[name="message"]') as HTMLTextAreaElement | null; if (!textarea) return; const start = textarea.selectionStart; const end = textarea.selectionEnd; textarea.setRangeText(emoji, start, end, 'end'); textarea.dispatchEvent(new Event('input', { bubbles: true })); textarea.focus(); setEmojiPop(emoji); const now = Date.now(); setFloatingEmojis(Array.from({ length: 14 }, (_, index) => ({ id: now + index, emoji: loveEmojis[(index + Math.floor(Math.random() * loveEmojis.length)) % loveEmojis.length], left: 8 + Math.random() * 84, top: 12 + Math.random() * 68, rotate: -25 + Math.random() * 50 }))); window.setTimeout(() => { setEmojiPop(null); setFloatingEmojis([]) }, 1500) }}>{emoji}</button>)}</div></label><button className="primary-button" type="submit">Kirim Konfirmasi</button></form>}<section className="wish-list"><span className="eyebrow">MESSAGES FROM GUESTS</span><h2>Ucapan untuk kami</h2>{wishes.length === 0 ? <p className="wish-empty">Belum ada ucapan. Jadilah yang pertama.</p> : wishes.map((wish) => <article className="wish-item" key={wish.id}><div><b>{wish.name}</b><small>{wish.attendance}</small></div><p>{wish.message}</p></article>)}</section><div className="gift-section"><span className="eyebrow">WEDDING GIFT</span><h2>Amplop Online</h2><p className="gift-note">Doa restu Anda sudah cukup. Namun jika ingin memberi tanda kasih, silakan pilih rekening di bawah ini.</p><div className="gift-list">{giftAccounts.map((account) => <button className="gift-card" key={account.id} onClick={() => { setActiveGift(account); setCopied(false) }}><span className="gift-logo"><img src={account.logo} alt={account.bank} onError={(event) => { event.currentTarget.style.display = 'none' }} /></span><span className="gift-info"><b>{account.role}</b><small>{account.bank} · {account.holder}</small></span><span className="gift-arrow">›</span></button>)}</div></div></section>}
      {activeGift && <div className="gift-modal" onClick={() => setActiveGift(null)}><div className="gift-dialog" onClick={(event) => event.stopPropagation()}><button className="gift-close" onClick={() => setActiveGift(null)} aria-label="Tutup">×</button><span className="gift-logo large"><img src={activeGift.logo} alt={activeGift.bank} onError={(event) => { event.currentTarget.style.display = 'none' }} /></span><span className="eyebrow">{activeGift.role.toUpperCase()}</span><h3>{activeGift.bank}</h3><p className="gift-number">{activeGift.number}</p><p className="gift-holder">a.n. {activeGift.holder}</p><button className="primary-button gift-copy" onClick={() => { navigator.clipboard?.writeText(activeGift.number); setCopied(true); window.setTimeout(() => setCopied(false), 2200) }}>{copied ? '✓ Tersalin' : 'Salin Nomor Rekening'}</button></div></div>}

      {floatingEmojis.length > 0 && <div className="floating-emoji-layer" aria-hidden="true">{floatingEmojis.map((item) => <span className="floating-emoji" key={item.id} style={{ left: `${item.left}%`, top: `${item.top}%`, '--emoji-rotate': `${item.rotate}deg` } as React.CSSProperties}>{item.emoji}</span>)}</div>}
      <audio ref={audioRef} loop preload="metadata" onPlay={() => setMusicPlaying(true)} onPause={() => setMusicPlaying(false)}><source src="/music-placeholder.mp3" type="audio/mpeg" /></audio>
      <nav className="bottom-nav">{([['home', '⌂', 'Home'], ['story', '♡', 'Cerita'], ['event', '▣', 'Acara'], ['rsvp', '✉', 'RSVP'] ] as [Tab, string, string][]).map(([key, icon, label]) => <button className={tab === key ? 'active' : ''} key={key} onClick={() => selectTab(key)}><span>{icon}</span>{label}</button>)}</nav>
    </main>
  )
}

export default App
