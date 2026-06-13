/**
 * Legacy route — redirects to unified create flow on Projects page.
 * All creates use NewProjectModal + createProject() from projects.queries.ts
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CreateProject = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate('/projects?create=1', { replace: true, state: location.state });
  }, [navigate, location.state]);

  return null;
};

export default CreateProject;
