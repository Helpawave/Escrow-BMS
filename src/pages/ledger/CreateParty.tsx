import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Party creation has been unified into the Clients & Parties management page (/billing/clients).
 * Redirects automatically.
 */
const CreateParty = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/billing/clients', { replace: true });
  }, [navigate]);

  return null;
};

export default CreateParty;
