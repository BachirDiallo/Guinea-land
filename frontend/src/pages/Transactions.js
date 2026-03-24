import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Receipt, 
  Plus,
  ArrowRight,
  House,
  Calendar,
  FilePdf,
  DownloadSimple
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Transactions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API}/transactions`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (transactionId) => {
    setDownloadingPdf(transactionId);
    try {
      const res = await fetch(`${API}/transactions/${transactionId}/pdf`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction_${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF téléchargé avec succès!');
    } catch (error) {
      toast.error('Erreur lors du téléchargement du PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="transactions-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">{t('transactions.title')}</h1>
              <p className="text-primary-foreground/80 text-sm sm:text-base">
                Historique de vos transactions foncières
              </p>
            </div>
            <Button 
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-brutal-sm gap-2 w-full sm:w-auto"
              asChild
            >
              <Link to="/transactions/new">
                <Plus className="w-5 h-5" />
                {t('transactions.new')}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {transactions.length === 0 ? (
          <div className="bg-card border border-border p-8 sm:p-12 text-center">
            <Receipt className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold mb-2">Aucune transaction</h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Vous n'avez pas encore de transactions enregistrées
            </p>
            <Button asChild>
              <Link to="/listings">
                Explorer les terrains disponibles
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((txn) => (
              <div 
                key={txn.transaction_id}
                className="bg-card border border-border p-4 sm:p-6 card-hover-lift"
              >
                <div className="flex flex-col gap-4">
                  {/* Top Row - Land Info & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary flex items-center justify-center flex-shrink-0">
                        <House className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" weight="duotone" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg">{txn.land_title || 'Terrain'}</h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            {new Date(txn.transaction_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="hidden sm:inline">ID: {txn.transaction_id}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white text-xs">
                      {txn.status === 'completed' ? 'Complété' : txn.status}
                    </Badge>
                  </div>

                  {/* Middle Row - Parties & Price */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                    {/* Parties */}
                    <div className="flex items-center gap-3 sm:gap-4 text-sm">
                      <div className="text-center flex-1 sm:flex-none">
                        <div className="text-xs text-muted-foreground uppercase mb-1">{t('transactions.seller')}</div>
                        <div className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{txn.seller_name}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                      <div className="text-center flex-1 sm:flex-none">
                        <div className="text-xs text-muted-foreground uppercase mb-1">{t('transactions.buyer')}</div>
                        <div className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{txn.buyer_name}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-center sm:text-right">
                      <div className="text-xs text-muted-foreground uppercase mb-1">{t('transactions.price')}</div>
                      <div className="text-lg sm:text-xl font-black text-accent">{txn.price?.toLocaleString()} GNF</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {txn.notes && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">{txn.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadPdf(txn.transaction_id)}
                      disabled={downloadingPdf === txn.transaction_id}
                      className="gap-2 w-full sm:w-auto"
                      data-testid={`download-pdf-btn-${txn.transaction_id}`}
                    >
                      {downloadingPdf === txn.transaction_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <FilePdf className="w-4 h-4" />
                          Télécharger PDF
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                      <Link to={`/lands/${txn.land_id}`}>
                        Voir le terrain
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
