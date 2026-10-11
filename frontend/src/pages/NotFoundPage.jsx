/** 404 page (empty-state pattern). Works for logged-in and logged-out visitors. */
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { EmptyState } from '../components/ui.jsx';

export default function NotFoundPage() {
  return (
    <AuthLayout wide>
      <EmptyState icon="search" title="Page not found" text="The page you are looking for does not exist or has moved." action={<Link to="/" className="btn btn-primary">Go to my files</Link>} />
    </AuthLayout>
  );
}
