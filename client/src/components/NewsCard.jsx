import { Newspaper, ExternalLink, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';

const NewsCard = ({ news = [] }) => {

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return <ThumbsUp className="h-3.5 w-3.5 text-accent-green" />;
      case 'negative':
        return <ThumbsDown className="h-3.5 w-3.5 text-accent-red" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-accent-amber" />;
    }
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-accent-green/10 text-accent-green border-accent-green/30';
      case 'negative':
        return 'bg-accent-red/10 text-accent-red border-accent-red/30';
      default:
        return 'bg-accent-amber/10 text-accent-amber border-accent-amber/30';
    }
  };

  return (
    <div className="glass-panel p-6 border-l-4 border-l-accent-blue flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-2 mb-5 pb-3 border-b border-slate-900/60">
          <Newspaper className="h-5 w-5 text-accent-blue" />
          <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-slate-200">
            Latest news & sentiment
          </h3>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {news && news.length > 0 ? (
            news.map((item, index) => (
              <div 
                key={index} 
                className="group flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-all duration-200"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase truncate max-w-[120px]">{item.source}</span>
                    
                    {/* Sentiment tag */}
                    <span className={`flex items-center space-x-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${getSentimentBadge(item.sentiment)}`}>
                      {getSentimentIcon(item.sentiment)}
                      <span className="uppercase">{item.sentiment || 'Neutral'}</span>
                    </span>
                  </div>

                  {item.url ? (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-semibold text-slate-200 group-hover:text-accent-blue flex items-start gap-1 transition-colors duration-150 leading-snug"
                    >
                      <span className="line-clamp-2">{item.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-slate-200 leading-snug line-clamp-2">
                      {item.title}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">No news articles found in the research window.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
