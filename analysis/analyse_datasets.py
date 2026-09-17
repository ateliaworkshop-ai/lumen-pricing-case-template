"""Analyse descriptive reproductible ; aucune modification des sources."""
from pathlib import Path
import numpy as np
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]
def read(name): return pd.read_csv(ROOT/'data'/f'{name}.csv')
def show(label,obj):
 print('\n'+label)
 print(obj.round(4).to_string() if isinstance(obj,(pd.DataFrame,pd.Series)) else obj)
s=read('historical_sales_weekly').drop_duplicates()
s['date']=pd.to_datetime(s.week_start_date);s['month']=s.date.dt.to_period('M');s['price']=s.revenue_eur/s.units_sold
m=read('marketing_funnel_monthly');m['month']=pd.to_datetime(m.month).dt.to_period('M')
w=s.pivot_table(index='date',columns='country',values='units_sold',aggfunc='sum')
show('Weekly country correlations n=78',w.corr());show('Weekly changes correlations n=77',w.diff().corr())
show('Country totals',s.groupby('country').agg(units=('units_sold','sum'),revenue=('revenue_eur','sum')))
show('Channel share %',100*s.groupby(['country','channel']).units_sold.sum()/s.groupby('country').units_sold.sum())
show('Price-volume correlations by country/channel',s.groupby(['country','channel'])[['price','units_sold']].corr().iloc[::2,-1])
# Residuals after calendar-month effects and linear trend, on log weekly totals.
X=pd.get_dummies(w.index.month,drop_first=True,dtype=float).to_numpy(); X=np.column_stack([np.ones(len(w)),np.arange(len(w)),X])
y=np.log(w.to_numpy());res=pd.DataFrame(y-X@np.linalg.lstsq(X,y,rcond=None)[0],index=w.index,columns=w.columns)
show('Residual correlations (log sales, trend + calendar month)',res.corr())
for ch,d in s.groupby('channel'):
 show('Same-channel country correlations '+ch,d.pivot(index='date',columns='country',values='units_sold').corr())
# Outliers relative to local 9-week median within each country/channel.
s=s.sort_values(['country','channel','date']);s['local_median']=s.groupby(['country','channel']).units_sold.transform(lambda x:x.rolling(9,center=True,min_periods=4).median());s['ratio']=s.units_sold/s.local_median
show('Largest local spike ratios',s.nlargest(4,'ratio')[['week_start_date','country','channel','units_sold','promo_active','ratio']])
spike=s.loc[s.ratio.idxmax()];no=s.drop(index=spike.name);wn=no.pivot_table(index='date',columns='country',values='units_sold',aggfunc='sum').drop(pd.Timestamp(spike.date))
show('Country correlations excluding spike entire week n=77',wn.corr())
agg=s.groupby('month').agg(units=('units_sold','sum'),revenue=('revenue_eur','sum'),weeks=('date','nunique'))
agg['weekly_mean']=agg.units/agg.weeks
ma=m.groupby('month').agg(spend=('spend_eur','sum'),acquired=('conversions_customers_acquired','sum'))
z=agg.join(ma);show('Monthly joined n=18 (weeks allocated by starting date)',z)
show('Monthly correlations',z[['units','weekly_mean','revenue','spend','acquired']].corr())
show('Monthly first differences correlations n=17',z[['units','weekly_mean','spend','acquired']].diff().corr())
for lag in [1,2]: print('lag spend->weekly mean',lag,z.spend.shift(lag).corr(z.weekly_mean))
for ch,d in m.groupby('channel'):
 print('MARKETING',ch,'n',len(d),'CAC',d.spend_eur.sum()/d.conversions_customers_acquired.sum(),'CAC range',d.cac_eur.min(),d.cac_eur.max(),'spend-acquisition corr',d.spend_eur.corr(d.conversions_customers_acquired),'LTV mean',d.ltv_estimate_eur.mean())
print('BLENDED CAC',m.spend_eur.sum()/m.conversions_customers_acquired.sum(),'SPEND',m.spend_eur.sum(),'ACQUIRED',m.conversions_customers_acquired.sum(),'CAC identity max error',(m.spend_eur/m.conversions_customers_acquired-m.cac_eur).abs().max())
season=read('seasonality_and_weather').set_index('month')
print('SEASON mean',season.seasonality_index_100_avg.mean(),'temp corr',season.corr().iloc[0,1])
wc=w.copy();wc['month']=wc.index.month
show('Monthly-of-year mean weekly units (unbalanced 2x Jan-Jun,1x Jul-Dec)',wc.groupby('month').mean())
for c in w: print('SEASON correlation weekly',c,w[c].corr(pd.Series(w.index.month.map(season.seasonality_index_100_avg),index=w.index)))
# Compare common first 26 weeks in each year.
p=s.groupby(['country',s.date.dt.year]).units_sold.sum(); first=s[s.date.dt.month<=6].groupby(['country',s.date.dt.year]).units_sold.sum();show('Jan-Jun growth %',(first.unstack()[2026]/first.unstack()[2025]-1)*100)
q=read('customer_survey').drop(columns=['first_name','last_name','email']);v=read('price_sensitivity_survey')
show('DE preferred channel %',q.preferred_channel.value_counts(normalize=True)*100);show('DE segment n',q.segment.value_counts());print('DE intent mean',q.lumen_purchase_intent_1_10.mean());print('Respondent ID overlaps with mismatched segments',q.merge(v,on='respondent_id',suffixes=('_q','_v')).eval('segment_q != segment_v').sum())
show('Price survey thresholds median by segment',v.groupby('segment')[['too_cheap_eur','cheap_eur','expensive_eur','too_expensive_eur']].median())
show('Price tests',read('price_test_results'));show('Market context',read('market_context'))
show('Inventory',pd.DataFrame([{'file':p.name,'rows':len(pd.read_csv(p)),'exact_duplicates':int(pd.read_csv(p).duplicated().sum()),'missing_cells':int(pd.read_csv(p).isna().sum().sum())} for p in sorted((ROOT/'data').glob('*.csv'))]))
assert len(s)==702 and not s.duplicated(['week_start_date','country','channel']).any()
assert s.groupby(['country','channel']).size().eq(78).all()
print('PROMO n',s.promo_active.sum(),'POOLED PRICE CORR',s.price.corr(s.units_sold))
show('Promo descriptive means',s.groupby('promo_active')[['price','units_sold']].mean())
show('Price ranges',s.groupby(['country','channel']).price.agg(['mean','min','max']))
print('TOTAL REVENUE',s.revenue_eur.sum())
