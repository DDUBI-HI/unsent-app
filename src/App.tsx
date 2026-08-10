import { Route, Routes } from 'react-router-dom';
import ContactList from './pages/ContactList';
import NewContact from './pages/NewContact';
import ContactDetail from './pages/ContactDetail';
import ChatView from './pages/ChatView';
import MemoView from './pages/MemoView';

function App() {
  return (
    <div className="min-h-svh bg-neutral-200 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-neutral-50 shadow-xl dark:bg-neutral-900">
        <Routes>
          <Route path="/" element={<ContactList />} />
          <Route path="/new" element={<NewContact />} />
          <Route path="/c/:id" element={<ContactDetail />}>
            <Route index element={<ChatView />} />
            <Route path="memo" element={<MemoView />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;
