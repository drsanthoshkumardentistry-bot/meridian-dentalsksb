import { useApp } from './state/AppContext.jsx'
import { useRoute } from './state/router.js'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { TopicDetail, TopicHub } from './pages/TopicHub.jsx'
import { VivaHome, VivaSession } from './pages/Viva.jsx'
import Spotters from './pages/Spotters.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Mcq from './pages/Mcq.jsx'
import { Auth, Profile } from './pages/Account.jsx'
import { CourseView, DocView, StudyHome } from './pages/Study.jsx'

export default function App() {
  const { ready } = useApp()
  const route = useRoute()
  if (!ready) return <Splash />
  const [, a, b] = route.parts
  let page
  switch (route.path) {
    case 'topics': page = <TopicHub />; break
    case 'topic': page = <TopicDetail slug={a} />; break
    case 'viva': page = <VivaHome />; break
    case 'viva-session': page = <VivaSession key={`${a}-${b}`} kind={a} id={b} />; break
    case 'spotters': page = <Spotters />; break
    case 'flashcards': page = <Flashcards />; break
    case 'mcq': page = <Mcq />; break
    case 'study': page = <StudyHome />; break
    case 'course': page = <CourseView key={a} id={a} />; break
    case 'doc': page = <DocView key={a} id={a} />; break
    case 'auth': page = <Auth />; break
    case 'profile': page = <Profile />; break
    default: page = <Dashboard />
  }
  return <Layout route={route}>{page}</Layout>
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <img src="favicon.svg" alt="" className="h-12 w-12 animate-pulse" />
        <span className="text-sm font-semibold">Loading MeriDent Prep…</span>
      </div>
    </div>
  )
}
