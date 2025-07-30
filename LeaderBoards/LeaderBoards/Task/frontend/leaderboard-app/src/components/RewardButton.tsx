impinterface RewardButtonProps {
  userId?: string;
  onClaim?: () => void;
}

const RewardButton: React.FC<RewardButtonProps> = ({ userId, onClaim }) => {rt React from 'react';
}
import { FaGift } from 'react-icons/fa';

const RewardButton: React.FC = () => (
  <button
    className="flex items-center gap-2 bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-full shadow-xl transition duration-300 ease-in-out text-sm hover:scale-110"
    style={{ minWidth: 90 }}
    title="Rewards"
  >
    <FaGift className="text-lg text-shadow" />
    <span className="text-shadow">Rewards</span>
  </button>
);

export default RewardButton; 