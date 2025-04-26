import React from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/dumbo.png';


const DonateCard = () => {
    const { t } = useTranslation();

    return (

        <div class="col-12 text-center shadow">
            <div class="box-column">
                <div class="box-header box-header-instagram">
                    <img src={logo} width="70" alt='logo'></img>
                </div>
                <div class="box-bottom">
                    <div class="box-title instagram-title">
                        MindMingle
                    </div>
                    <div class="box-text">
                        {t('Where curious minds connect, share knowledge, and grow together in a vibrant educational community web.')}
                    </div>
                    <a href="#" target="_blank">{t('MindMingle')}</a>
                </div>
            </div>
        </div>
    );
};

export default DonateCard;


