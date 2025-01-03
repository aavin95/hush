import styled from "styled-components";
import { FaGithub } from "react-icons/fa";

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 1.5rem;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #ffffff;
  width: 3rem;
  height: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;

  &:hover {
    color: #000;
    transform: scale(1.1);
    background-color: #f0f0f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const GitHubButton = () => {
  return (
    <StyledLink
      href="https://github.com/aavin95/hush"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View source on GitHub"
    >
      <FaGithub />
    </StyledLink>
  );
};

export default GitHubButton;
