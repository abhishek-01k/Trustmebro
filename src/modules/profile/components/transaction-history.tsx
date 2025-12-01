import { ArrowUpRight } from "lucide-react";
import React from "react";

interface Transaction {
  id: string;
  eventName: string;
  txHash: string;
  timestamp: string;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions = [
    {
      id: "1",
      eventName: "Game Created",
      txHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
      timestamp: "2024-03-15 14:30",
    },
    {
      id: "2",
      eventName: "Cash Out",
      txHash: "0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a",
      timestamp: "2024-03-15 12:15",
    },
    {
      id: "3",
      eventName: "Game Created",
      txHash: "0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      timestamp: "2024-03-14 18:45",
    },
    {
      id: "4",
      eventName: "Cash Out",
      txHash: "0xz6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1",
      timestamp: "2024-03-14 16:20",
    },
    {
      id: "5",
      eventName: "Game Created",
      txHash: "0x5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1",
      timestamp: "2024-03-13 10:00",
    },
  ],
}) => {
  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach((transaction) => {
      const date = transaction.timestamp.split(' ')[0]; // Extract date part
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    // Sort dates in descending order (newest first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time part for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const formatTxHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 8)}...`;
  };

  const getEventIcon = (eventName: string) => {
    switch (eventName.toLowerCase()) {
      case "game created":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        );
      case "cash out":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleViewTransaction = (txHash: string) => {
    // Base chain explorer URL
    const baseExplorerUrl = `https://basescan.org/tx/${txHash}`;
    window.open(baseExplorerUrl, "_blank");
  };

  return (
    <div className="w-full bg-[#0b0a0a]/50 rounded-2xl p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold ">
          {transactions.length} Txns created
        </p>
      </div>

      {/* Transactions List - Grouped by Date */}
      <div className="space-y-5">
        {groupedTransactions.map(([date, dateTransactions]) => (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-3 px-1 mb-1">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                {formatDate(date)}
              </p>
              <div className="h-px flex-1 bg-linear-to-r from-white/20 to-transparent" />
            </div>

            {/* Transactions for this date */}
            <div className="space-y-2">
              {dateTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group flex items-center gap-3 rounded-xl p-3 border border-white/10 hover:bg-white/5 hover:border-[#a9062c]/50 transition-all duration-300 cursor-pointer"
                >
                  {/* Event Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      transaction.eventName.toLowerCase() === "game created"
                        ? "bg-[#a9062c]/15 text-[#a9062c] group-hover:bg-[#a9062c]/25"
                        : "bg-green-500/15 text-green-400 group-hover:bg-green-500/25"
                    }`}
                  >
                    {getEventIcon(transaction.eventName)}
                  </div>

                  {/* Event Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                      {transaction.eventName}
                    </p>
                    <p className="text-xs text-white/60 font-mono group-hover:text-white/80 transition-colors">
                      {formatTxHash(transaction.txHash)}
                    </p>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() => handleViewTransaction(transaction.txHash)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white bg-gradient-to-b from-[#a9062c] to-[#4e1624] hover:from-[#8d0524] hover:to-[#3d1119] font-semibold uppercase tracking-wide shadow-lg transition-all duration-300 ease-in-out active:scale-95"
                  >
                    <span className="text-xs font-semibold">View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
