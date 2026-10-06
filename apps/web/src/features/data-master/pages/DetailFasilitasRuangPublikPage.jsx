import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DetailFasilitasRuangPublik from '../components/DetailFasilitasRuangPublik';
import { getAllFacilitiesGrouped } from '../../../services/fasilitasService';
import { getPublicSpaceDetail } from '../../../services/ruangPublikService';

const DetailFasilitasRuangPublikPage = () => {
  const { ruangPublikId } = useParams();
  const [ruangPublik, setRuangPublik] = useState(null);
  const [fasilitas, setFasilitas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const muatData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ruang, groups] = await Promise.all([
        getPublicSpaceDetail(ruangPublikId),
        getAllFacilitiesGrouped(),
      ]);
      setRuangPublik(ruang);
      setFasilitas(groups[ruangPublikId] || []);
    } finally {
      setIsLoading(false);
    }
  }, [ruangPublikId]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  return (
    <DetailFasilitasRuangPublik
      ruangPublik={ruangPublik}
      fasilitas={fasilitas}
      isLoading={isLoading}
      onRefresh={muatData}
    />
  );
};

export default DetailFasilitasRuangPublikPage;
