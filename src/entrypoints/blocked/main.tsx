import '@fontsource/amiri/arabic-400.css';
import '~/assets/app.css';
import { render } from 'preact';
import { BlockedPage } from './BlockedPage';
import { applyDocumentLocale } from '~/shared/document-locale';
import { recordBlock } from '~/shared/stats';

applyDocumentLocale('blockedTitle');

// DNR also redirects blocked iframes here; only a top-level visit is a user's attempt worth counting.
const isTopLevel = window.top === window;

render(<BlockedPage count={isTopLevel ? recordBlock() : null} />, document.getElementById('app')!);
